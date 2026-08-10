// Matcha tea fluid ecosystem — Create integration for the custom matcha items.
//
// NAMING:
//   ITEMS  use bare names:  kubejs:matcha, sweet_matcha, matcha_latte, honey_matcha
//   FLUIDS use _brew suffix: kubejs:matcha_brew, sweet_matcha_brew, etc.
//   (See matcha.js startup script for why — avoids registry collision.)
//
// PIPELINE:
//   [Mill]         dried_kelp                   -> matcha_powder
//   [Mixer+heat]   water + matcha_powder        -> matcha_brew (fluid)
//   [Mixer]        matcha_brew + sugar          -> sweet_matcha_brew
//   [Mixer]        matcha_brew + minecraft:milk -> matcha_latte_brew
//   [Mixer]        matcha_brew + create:honey   -> honey_matcha_brew
//   [Item Drain]   drink_item                   -> drink_brew + glass bottle
//   [Spout]        glass bottle + drink_brew    -> drink_item
//
// All fluid volumes are 250mb to match the rest of the drink ecosystem.

ServerEvents.recipes(event => {
    const brew = name => Fluid.of(`kubejs:${name}_brew`, 250)

    // ===== POWDER from milling dried kelp =====
    event.recipes.create.milling(
        'kubejs:matcha_powder',
        'minecraft:dried_kelp'
    )

    // ===== BASE PRODUCTION (heated mixing) =====
    event.recipes.create.mixing(
        brew('matcha'),
        [Fluid.of('minecraft:water', 250), 'kubejs:matcha_powder']
    ).heated()

    // ===== VARIANT MIXING (no heat) =====
    event.recipes.create.mixing(
        brew('sweet_matcha'),
        [brew('matcha'), 'minecraft:sugar']
    )
    event.recipes.create.mixing(
        brew('matcha_latte'),
        [brew('matcha'), Fluid.of('minecraft:milk', 250)]
    )
    event.recipes.create.mixing(
        brew('honey_matcha'),
        [brew('matcha'), Fluid.of('create:honey', 250)]
    )

    // ===== EMPTYING + FILLING for each drink =====
    const drinks = ['matcha', 'sweet_matcha', 'matcha_latte', 'honey_matcha']
    drinks.forEach(name => {
        event.recipes.create.emptying(
            [brew(name), 'minecraft:glass_bottle'],
            `kubejs:${name}`
        )
        event.recipes.create.filling(
            `kubejs:${name}`,
            ['minecraft:glass_bottle', brew(name)]
        )
    })
})
