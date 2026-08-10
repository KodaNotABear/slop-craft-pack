// Full Create integration for End's Delight drinks.
//
// PRODUCTION (heated Mixer):
//   milk + chorus_fruit*  + ender_pearl_grain      -> bubble_tea
//   water + ghast_tear + dried_chorus_flower       -> chorus_flower_tea
//   milk + chorus_fruit*                            -> chorus_fruit_milk_tea
//   water + sugar + 2x chorus_fruit*                -> chorus_fruit_wine
//
//   * = either minecraft:chorus_fruit or ends_delight:chorus_fruit_grain (KubeJS '|' OR syntax)
//
// EMPTYING (Item Drain): drink_item -> drink_fluid + glass bottle
// FILLING  (Spout):      glass bottle + drink_fluid -> drink_item
//
// All volumes are 250mb. The original ED recipes don't specify a glass bottle container
// (drinks are standalone items), but for Create integration we use glass bottle as the
// canonical container so the fluid system stays consistent with the coffee one. Side
// effect: draining an ED drink yields a free glass bottle.

ServerEvents.recipes(event => {
    const drink = name => Fluid.of(`kubejs:${name}`, 250)
    const chorusFruit = 'minecraft:chorus_fruit | ends_delight:chorus_fruit_grain'

    // ===== PRODUCTION (heated mixing) =====
    // bubble_tea: milk base + chorus fruit + ender pearl grain
    event.recipes.create.mixing(
        drink('bubble_tea'),
        [
            Fluid.of('minecraft:milk', 250),
            chorusFruit,
            'ends_delight:ender_pearl_grain',
        ]
    ).heated()

    // chorus_flower_tea: water base + ghast tear + dried chorus flower
    event.recipes.create.mixing(
        drink('chorus_flower_tea'),
        [
            Fluid.of('minecraft:water', 250),
            'minecraft:ghast_tear',
            'ends_delight:dried_chorus_flower',
        ]
    ).heated()

    // chorus_fruit_milk_tea: milk base + chorus fruit
    event.recipes.create.mixing(
        drink('chorus_fruit_milk_tea'),
        [
            Fluid.of('minecraft:milk', 250),
            chorusFruit,
        ]
    ).heated()

    // chorus_fruit_wine: water + sugar + 2x chorus fruit
    event.recipes.create.mixing(
        drink('chorus_fruit_wine'),
        [
            Fluid.of('minecraft:water', 250),
            'minecraft:sugar',
            chorusFruit,
            chorusFruit,
        ]
    ).heated()

    // ===== EMPTYING + FILLING for each drink =====
    const drinks = [
        'bubble_tea',
        'chorus_flower_tea',
        'chorus_fruit_milk_tea',
        'chorus_fruit_wine',
    ]
    drinks.forEach(name => {
        event.recipes.create.emptying(
            [drink(name), 'minecraft:glass_bottle'],
            `ends_delight:${name}`
        )
        event.recipes.create.filling(
            `ends_delight:${name}`,
            ['minecraft:glass_bottle', drink(name)]
        )
    })
})
