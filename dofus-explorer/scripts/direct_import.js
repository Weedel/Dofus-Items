const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const API_BASE_URL = 'https://api.dofusdb.fr';
const BATCH_SIZE = 50; // API limit
const INSERT_BATCH_SIZE = 100; // Reduced to isolate errors
const RATE_LIMIT_MS = 200;
const MAX_RETRIES = 3;

// Lecture des variables d'environnement
function getEnvConfig() {
    // 1. Essayer process.env (si chargé par Bun)
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        console.log('✅ Variables chargées depuis process.env');
        return {
            VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
        };
    }

    // 2. Lecture manuelle de .env.local
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.log('⚠️ .env.local non trouvé à:', envPath);
            return {};
        }

        console.log('📖 Lecture manuelle de .env.local...');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const config = {};

        envContent.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;

            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let key = match[1].trim();
                let value = match[2].trim();
                // Enlever les quotes si présentes
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                config[key] = value;
            }
        });
        return config;
    } catch (error) {
        console.error('Erreur lecture .env.local:', error.message);
        return {};
    }
}

const config = getEnvConfig();
const supabaseUrl = config.VITE_SUPABASE_URL;
const supabaseKey = config.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant.');
    console.log('Contenu config trouvé:', Object.keys(config));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Utils
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logProgress(current, total, label) {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${current}/${total})`);
}

// Fetching Logic
async function fetchAllFromEndpoint(endpoint, label) {
    console.log(`\n📡 Récupération des données depuis ${endpoint}...`);
    let allData = [];
    let skip = 0;
    let total = null;
    let retries = 0;

    while (total === null || skip < total) {
        try {
            const url = `${API_BASE_URL}${endpoint}?$limit=${BATCH_SIZE}&$skip=${skip}`;
            const response = await axios.get(url);
            const { data, total: apiTotal } = response.data;

            if (total === null) {
                total = apiTotal;
                console.log(`\n✓ Total: ${total} éléments à récupérer`);
            }

            allData = allData.concat(data);
            skip += data.length;
            logProgress(skip, total, label);

            if (skip < total) await sleep(RATE_LIMIT_MS);
            retries = 0;
        } catch (error) {
            retries++;
            console.error(`\n❌ Erreur requête (tentative ${retries}/${MAX_RETRIES}):`, error.message);
            if (retries >= MAX_RETRIES) throw error;
            await sleep(1000 * Math.pow(2, retries));
        }
    }
    console.log(`\n✅ ${allData.length} éléments récupérés\n`);
    return allData;
}

// Insertion Logic
async function batchInsert(table, data, label) {
    console.log(`💾 Insertion dans ${table}...`);
    let inserted = 0;

    for (let i = 0; i < data.length; i += INSERT_BATCH_SIZE) {
        const batch = data.slice(i, i + INSERT_BATCH_SIZE);
        const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`\n❌ Erreur insertion ${table}:`, error.message);
        } else {
            inserted += batch.length;
        }
        logProgress(Math.min(inserted, data.length), data.length, `Insertion ${table}`);
    }
    console.log(`\n✅ ${inserted}/${data.length} lignes insérées dans ${table}\n`);
}

async function run() {
    console.log('🚀 Démarrage de l\'import direct vers Supabase\n');

    try {
        // 0. Check existing items
        const { count: itemsCount, error: countError } = await supabase
            .from('items')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        console.log(`📊 Items existants: ${itemsCount}`);

        // 1. Items
        if (itemsCount < 20000) {
            const itemsData = await fetchAllFromEndpoint('/items', 'Fetch Items');
            const formattedItems = itemsData.map(item => ({
                id: item.id,
                name: item.name?.fr || item.name?.en || '',
                level: item.level || 0,
                type: item.type?.name?.fr || item.type?.name?.en || '',
                img_url: item.img || `https://api.dofusdb.fr/img/items/${item.iconId}.png`,
                description: item.description?.fr || item.description?.en || ''
            }));
            await batchInsert('items', formattedItems, 'Items');
            // Free memory
            itemsData.length = 0;
        } else {
            console.log('⏩ Items déjà importés, passage à la suite...');
        }

        // 2. Recipes
        const recipesData = await fetchAllFromEndpoint('/recipes', 'Fetch Recipes');
        const formattedRecipes = recipesData.map(recipe => ({
            id: recipe.id,
            item_id: recipe.resultId,
            job_id: recipe.jobId || 0,
            job_name: recipe.job?.name?.fr || recipe.job?.name?.en || ''
        }));
        await batchInsert('recipes', formattedRecipes, 'Recipes');

        // 3. Recipe Ingredients
        console.log('🍳 Préparation des ingrédients...');
        let allIngredients = [];
        recipesData.forEach(recipe => {
            if (recipe.ingredientIds && recipe.quantities) {
                recipe.ingredientIds.forEach((ingId, idx) => {
                    allIngredients.push({
                        recipe_id: recipe.id,
                        item_id: ingId,
                        quantity: recipe.quantities[idx] || 1
                    });
                });
            }
        });

        // Upsert recipe ingredients (composite key recipe_id, item_id)
        console.log(`💾 Insertion de ${allIngredients.length} ingrédients...`);
        let insertedIng = 0;
        for (let i = 0; i < allIngredients.length; i += INSERT_BATCH_SIZE) {
            const batch = allIngredients.slice(i, i + INSERT_BATCH_SIZE);
            const { error } = await supabase.from('recipe_ingredients').upsert(batch, { onConflict: 'recipe_id,item_id' });
            if (error) console.error(`\n❌ Erreur ingrédients:`, error.message);
            else insertedIng += batch.length;
            logProgress(Math.min(insertedIng, allIngredients.length), allIngredients.length, 'Ingrédients');
        }
        console.log(`\n✅ ${insertedIng} ingrédients insérés\n`);

        console.log('🎉 Import terminé avec succès !');

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);
    }
}

run();
