// Custom matcha tea items + fluids, registered via KubeJS.
//
// Items (5):     kubejs:matcha_powder, matcha, sweet_matcha, matcha_latte, honey_matcha
// Fluids (4):    kubejs:matcha_brew, sweet_matcha_brew, matcha_latte_brew, honey_matcha_brew
//
// NOTE: Fluid IDs have a "_brew" suffix to avoid colliding with the drink items'
// IDs. Without the suffix, KubeJS's emptying recipe builder would mis-resolve
// item-string inputs as fluids (since an identically-named fluid would exist) and
// raise "Recipe has more fluid inputs (1) than supported (0)". Display names stay
// "Matcha", "Sweet Matcha", etc. — only internal IDs differ.
//
// Textures live at kubejs/assets/kubejs/textures/item/<name>.png — drinks are
// recolored from RD coffee textures, matcha_powder is a recolored sugar texture.

// ===== Item registration =====
StartupEvents.registry('item', event => {
    // Brewing ingredient — no food properties, just an item
    event.create('matcha_powder')
        .displayName('Matcha Powder')
        .maxStackSize(64)

    // Drink items — all consumable with food properties.
    // Drink animation comes from eatSeconds + usingConvertsTo(glass_bottle), which
    // mirrors how vanilla potions / honey_bottle behave.
    const drinks = ['matcha', 'sweet_matcha', 'matcha_latte', 'honey_matcha']
    drinks.forEach(name => {
        const displayName = name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
        event.create(name)
            .displayName(displayName)
            .food(food => food
                .nutrition(3)
                .saturation(0.3)
                .alwaysEdible()
                .eatSeconds(1.6)                                         // matches potion drink time
                .usingConvertsTo(Item.of('minecraft:glass_bottle'))      // return bottle on drink
            )
            .maxStackSize(16)
    })
})

// ===== Fluid registration =====
// IDs use "_brew" suffix; displayName keeps the human-readable name only.
StartupEvents.registry('fluid', event => {
    const fluids = {
        matcha_brew:       { color: 0x6FA644, label: 'Matcha' },
        sweet_matcha_brew: { color: 0x86C658, label: 'Sweet Matcha' },
        matcha_latte_brew: { color: 0xB8D88B, label: 'Matcha Latte' },
        honey_matcha_brew: { color: 0xB8B248, label: 'Honey Matcha' },
    }

    Object.keys(fluids).forEach(name => {
        const { color, label } = fluids[name]
        event.create(name, 'thin')
            .displayName(label)
            .tint(color)
            .type(typeBuilder => typeBuilder.tint(color))
    })
})
