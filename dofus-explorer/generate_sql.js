import fs from 'fs';

const recipes = JSON.parse(fs.readFileSync('recipes.json', 'utf8'));

const items = new Map();
const recipeInserts = [];
const recipeIngredientsInserts = [];

recipes.forEach(recipe => {
    // Process Result Item
    if (recipe.result) {
        items.set(recipe.result.id, {
            id: recipe.result.id,
            name: recipe.result.name.fr,
            level: recipe.result.level,
            type: recipe.result.type.name.fr,
            img_url: recipe.result.img,
            description: recipe.result.description.fr
        });
    }

    // Process Ingredients
    recipe.ingredients.forEach(ing => {
        items.set(ing.id, {
            id: ing.id,
            name: ing.name.fr,
            level: ing.level,
            type: ing.type.name.fr,
            img_url: ing.img,
            description: ing.description.fr
        });
    });

    // Process Recipe
    recipeInserts.push({
        id: recipe.id,
        item_id: recipe.resultId,
        job_id: recipe.jobId,
        job_name: recipe.job.name.fr
    });

    // Process Recipe Ingredients
    // Note: quantities array matches ingredientIds array order, but ingredients array might be different order?
    // Let's assume ingredients array in JSON has same items as ingredientIds.
    // Actually, recipe.ingredientIds and recipe.quantities are parallel arrays.
    // recipe.ingredients is an array of Item objects.

    recipe.ingredientIds.forEach((ingId, index) => {
        recipeIngredientsInserts.push({
            recipe_id: recipe.id,
            item_id: ingId,
            quantity: recipe.quantities[index]
        });
    });
});

// Generate SQL
let sql = '';

// Items
items.forEach(item => {
    const desc = item.description ? item.description.replace(/'/g, "''") : '';
    const name = item.name.replace(/'/g, "''");
    const type = item.type.replace(/'/g, "''");
    sql += `INSERT INTO items (id, name, level, type, img_url, description) VALUES (${item.id}, '${name}', ${item.level}, '${type}', '${item.img_url}', '${desc}') ON CONFLICT (id) DO NOTHING;\n`;
});

// Recipes
recipeInserts.forEach(recipe => {
    const jobName = recipe.job_name.replace(/'/g, "''");
    sql += `INSERT INTO recipes (id, item_id, job_id, job_name) VALUES (${recipe.id}, ${recipe.item_id}, ${recipe.job_id}, '${jobName}') ON CONFLICT (id) DO NOTHING;\n`;
});

// Recipe Ingredients
recipeIngredientsInserts.forEach(ri => {
    sql += `INSERT INTO recipe_ingredients (recipe_id, item_id, quantity) VALUES (${ri.recipe_id}, ${ri.item_id}, ${ri.quantity}) ON CONFLICT (recipe_id, item_id) DO NOTHING;\n`;
});

console.log(sql);
