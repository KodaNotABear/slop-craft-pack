// Full coffee fluid ecosystem - Create integration for all 6 Rustic Delight coffee variants.
//
// PRODUCTION (heated Mixer):
//   water + 1 roasted_coffee_beans                                -> coffee
//   water + 2 roasted_coffee_beans                                -> dark_coffee
//
// VARIANT FLUID MIXING (Mixer, no heat needed):
//   coffee + minecraft:milk fluid                                 -> milk_coffee
//   milk_coffee + create:honey fluid                              -> honey_coffee
//   milk_coffee + rusticdelight:syrup item                        -> syrup_coffee
//   milk_coffee + 2x cocoa_beans                                  -> chocolate_coffee
//
// EMPTYING (Item Drain) - every variant has its own fluid:
//   <variant>_item                                                -> <variant>_fluid + glass bottle
//
// FILLING (Spout):
//   glass bottle + <variant>_fluid                                -> <variant>_item
//
// All fluid volumes are 250mb (1 bottle = 1 cup of fluid, matches honey/milk_bottle convention).
// To get the fluids you need: honey_bottle drains to create:honey via Create's built-in recipe;
// milk_bucket / milk_bottle drains to minecraft:milk via vanilla NeoForge handlers + Create compat.

ServerEvents.recipes(event => {
    const coffee = name => Fluid.of(`kubejs:${name}`, 250)

    // ===== PRODUCTION (heated mixing) =====
    event.recipes.create.mixing(
        coffee('coffee'),
        [Fluid.of('minecraft:water', 250), 'rusticdelight:roasted_coffee_beans']
    ).heated()

    event.recipes.create.mixing(
        coffee('dark_coffee'),
        [Fluid.of('minecraft:water', 250), '2x rusticdelight:roasted_coffee_beans']
    ).heated()

    // ===== VARIANT FLUID MIXING (no heat needed) =====
    // coffee + milk -> milk_coffee
    event.recipes.create.mixing(
        coffee('milk_coffee'),
        [coffee('coffee'), Fluid.of('minecraft:milk', 250)]
    )

    // milk_coffee + honey -> honey_coffee
    event.recipes.create.mixing(
        coffee('honey_coffee'),
        [coffee('milk_coffee'), Fluid.of('create:honey', 250)]
    )

    // milk_coffee + syrup item -> syrup_coffee
    event.recipes.create.mixing(
        coffee('syrup_coffee'),
        [coffee('milk_coffee'), 'rusticdelight:syrup']
    )

    // milk_coffee + 2 cocoa beans -> chocolate_coffee
    event.recipes.create.mixing(
        coffee('chocolate_coffee'),
        [coffee('milk_coffee'), '2x minecraft:cocoa_beans']
    )

    // ===== EMPTYING + FILLING for each variant =====
    const variants = [
        'coffee',
        'dark_coffee',
        'milk_coffee',
        'honey_coffee',
        'syrup_coffee',
        'chocolate_coffee',
    ]
    variants.forEach(name => {
        // Item Drain: variant_item -> variant_fluid + glass bottle
        event.recipes.create.emptying(
            [coffee(name), 'minecraft:glass_bottle'],
            `rusticdelight:${name}`
        )
        // Spout: glass bottle + variant_fluid -> variant_item
        event.recipes.create.filling(
            `rusticdelight:${name}`,
            ['minecraft:glass_bottle', coffee(name)]
        )
    })
})
