// Farmer's Delight (cooking pot) backup path for matcha drinks.
//
// Mirrors the Rustic Delight coffee recipe pattern:
//   4 base ingredients   -> base drink
//   3 base + 1 addition  -> variant
//
// This is the no-Create production path — players without a Mixer setup can still
// brew matcha in a vanilla FD cooking pot. Less efficient than the Create path
// (which uses 1 matcha_powder per cup) but works with just FD.
//
// Also adds a shapeless crafting recipe: dried_kelp -> matcha_powder, so players
// can make powder without a Millstone.

ServerEvents.recipes(event => {
    // ===== Crafting fallback: dried_kelp -> matcha_powder =====
    event.shapeless('kubejs:matcha_powder', ['minecraft:dried_kelp'])

    // ===== FD cooking pot recipes =====
    const cookMatcha = (resultName, ingredients) => event.custom({
        type: 'farmersdelight:cooking',
        container: { id: 'minecraft:glass_bottle', count: 1 },
        cookingtime: 200,
        experience: 1.0,
        recipe_book_tab: 'drinks',
        ingredients: ingredients,
        result: { id: `kubejs:${resultName}`, count: 1 }
    })

    // base matcha: 4x matcha_powder
    cookMatcha('matcha', [
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
    ])

    // sweet_matcha: 3x matcha_powder + sugar
    cookMatcha('sweet_matcha', [
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'minecraft:sugar' },
    ])

    // matcha_latte: 3x matcha_powder + any milk source (FD milk_bottle or vanilla milk_bucket)
    cookMatcha('matcha_latte', [
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { tag: 'c:drinks/milk' },
    ])

    // honey_matcha: 3x matcha_powder + honey_bottle
    cookMatcha('honey_matcha', [
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'kubejs:matcha_powder' },
        { item: 'minecraft:honey_bottle' },
    ])
})
