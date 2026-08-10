// Register all six coffee fluids matching Rustic Delight's coffee item variants.
//
// Color hex values are picked to be visually distinct in JEI / fluid tanks:
//   coffee           — medium espresso brown
//   dark_coffee      — near-black, very dark roast
//   milk_coffee      — pale latte tan
//   honey_coffee     — golden amber
//   syrup_coffee     — warm rust brown
//   chocolate_coffee — dark cocoa
//
// All are 'thin' (water-like) fluids — KubeJS auto-applies the tint to the built-in
// thin_fluid_still / thin_fluid_flow textures, so no custom textures needed.
// FluidBuilder.tint() handles the bucket icon; FluidTypeBuilder.tint() (via .type())
// handles the actual block/render tint.

StartupEvents.registry('fluid', event => {
    const fluids = {
        coffee:           0x6F4E37,
        dark_coffee:      0x1A0F08,
        milk_coffee:      0xD4B8A0,
        honey_coffee:     0xD9A036,
        syrup_coffee:     0x965A26,
        chocolate_coffee: 0x4A2C1A,
    }

    Object.keys(fluids).forEach(name => {
        const color = fluids[name]
        // Format display name: 'milk_coffee' -> 'Milk Coffee'
        const displayName = name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
        event.create(name, 'thin')
            .displayName(displayName)
            .tint(color)
            .type(typeBuilder => typeBuilder.tint(color))
    })
})
