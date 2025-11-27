const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api.dofusdb.fr';
const OUTPUT_FILE = path.join(__dirname, '../supabase/complete_seed.sql');
const BATCH_SIZE = 50; // Maximum imposé par l'API
const RATE_LIMIT_MS = 200; // Délai entre les requêtes
const MAX_RETRIES = 3;

// Fonction pour attendre un certain temps
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour afficher la progression
function logProgress(current, total, label) {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
    process.stdout.write(`\r${label}: [${bar}] ${percentage}% (${current}/${total})`);
}

// Fonction pour récupérer toutes les données d'un endpoint avec pagination
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

            // Rate limiting
            if (skip < total) {
                await sleep(RATE_LIMIT_MS);
            }

            retries = 0; // Reset retries on success

        } catch (error) {
            retries++;
            console.error(`\n❌ Erreur lors de la requête (tentative ${retries}/${MAX_RETRIES}):`, error.message);

            if (retries >= MAX_RETRIES) {
                throw new Error(`Échec après ${MAX_RETRIES} tentatives`);
            }

            // Délai exponentiel avant retry
            await sleep(1000 * Math.pow(2, retries));
        }
    }

    console.log(`\n✅ ${allData.length} éléments récupérés avec succès\n`);
    return allData;
}

// Fonction pour échapper les caractères spéciaux dans les strings SQL
function escapeSQLString(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
}

// Fonction pour générer le SQL pour les items
function generateItemsSQL(items) {
    console.log('📝 Génération du SQL pour les items...');
    let sql = '-- ===================================\n';
    sql += '-- ITEMS (20749 items)\n';
    sql += '-- ===================================\n\n';

    const processedItems = new Set();

    items.forEach((item, index) => {
        if (processedItems.has(item.id)) return;
        processedItems.add(item.id);

        const name = escapeSQLString(item.name?.fr || item.name?.en || '');
        const description = escapeSQLString(item.description?.fr || item.description?.en || '');
        const type = escapeSQLString(item.type?.name?.fr || item.type?.name?.en || '');
        const imgUrl = item.img || `https://api.dofusdb.fr/img/items/${item.iconId}.png`;

        sql += `INSERT INTO items (id, name, level, type, img_url, description) VALUES (${item.id}, '${name}', ${item.level || 0}, '${type}', '${imgUrl}', '${description}') ON CONFLICT (id) DO NOTHING;\n`;

        if ((index + 1) % 1000 === 0) {
            logProgress(index + 1, items.length, 'Génération SQL items');
        }
    });

    console.log(`\n✅ ${processedItems.size} items SQL générés\n`);
    return sql;
}

// Fonction pour générer le SQL pour les recettes
function generateRecipesSQL(recipes) {
    console.log('📝 Génération du SQL pour les recettes...');
    let sql = '\n-- ===================================\n';
    sql += '-- RECIPES (4682 recettes)\n';
    sql += '-- ===================================\n\n';

    let recipeIngredientsSQL = '\n-- ===================================\n';
    recipeIngredientsSQL += '-- RECIPE INGREDIENTS\n';
    recipeIngredientsSQL += '-- ===================================\n\n';

    recipes.forEach((recipe, index) => {
        const jobName = escapeSQLString(recipe.job?.name?.fr || recipe.job?.name?.en || '');

        sql += `INSERT INTO recipes (id, item_id, job_id, job_name) VALUES (${recipe.id}, ${recipe.resultId}, ${recipe.jobId || 0}, '${jobName}') ON CONFLICT (id) DO NOTHING;\n`;

        // Ingrédients
        if (recipe.ingredientIds && recipe.quantities) {
            recipe.ingredientIds.forEach((ingredientId, i) => {
                const quantity = recipe.quantities[i] || 1;
                recipeIngredientsSQL += `INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES (${recipe.id}, ${ingredientId}, ${quantity}) ON CONFLICT (recipe_id, item_id) DO NOTHING;\n`;
            });
        }

        if ((index + 1) % 500 === 0) {
            logProgress(index + 1, recipes.length, 'Génération SQL recipes');
        }
    });

    console.log(`\n✅ ${recipes.length} recettes SQL générées\n`);
    return sql + recipeIngredientsSQL;
}

// Fonction principale
async function generateCompleteSQL() {
    console.log('🚀 Démarrage de l\'import complet DofusDB\n');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
        // Phase 1: Récupération des items
        console.log('\n📦 PHASE 1: Import des Items');
        console.log('='.repeat(60));
        const items = await fetchAllFromEndpoint('/items', 'Items');

        // Phase 2: Récupération des recettes
        console.log('\n📜 PHASE 2: Import des Recettes');
        console.log('='.repeat(60));
        const recipes = await fetchAllFromEndpoint('/recipes', 'Recipes');

        // Phase 3: Génération du SQL
        console.log('\n💾 PHASE 3: Génération du fichier SQL');
        console.log('='.repeat(60));

        let completSQL = '-- ===================================\n';
        completSQL += '-- DOFUSDB COMPLETE IMPORT\n';
        completSQL += `-- Généré le: ${new Date().toISOString()}\n`;
        completSQL += `-- Total items: ${items.length}\n`;
        completSQL += `-- Total recipes: ${recipes.length}\n`;
        completSQL += '-- ===================================\n\n';

        completSQL += generateItemsSQL(items);
        completSQL += generateRecipesSQL(recipes);

        // Écriture du fichier
        fs.writeFileSync(OUTPUT_FILE, completSQL);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log('✅ IMPORT TERMINÉ AVEC SUCCÈS !');
        console.log('='.repeat(60));
        console.log(`📊 Statistiques:`);
        console.log(`  • Items importés: ${items.length}`);
        console.log(`  • Recettes importées: ${recipes.length}`);
        console.log(`  • Fichier généré: ${OUTPUT_FILE}`);
        console.log(`  • Durée totale: ${duration}s`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERREUR FATALE:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Exécution
generateCompleteSQL();
