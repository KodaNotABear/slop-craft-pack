// Register fluid forms for End's Delight drinks.
//
// Colors chosen to be visually distinct from the coffee fluids and to evoke each drink:
//   bubble_tea           — boba-tan with creamy hint
//   chorus_flower_tea    — pale lavender (light end purple)
//   chorus_fruit_milk_tea — pinkish lavender (milk + chorus fruit)
//   chorus_fruit_wine    — deep purple end-wine
//
// All thin (water-like) fluids; same registration pattern as the coffee fluids.

StartupEvents.registry('fluid', event => {
    const fluids = {
        bubble_tea:            0x9F8AC0,
        chorus_flower_tea:     0xB59BB8,
        chorus_fruit_milk_tea: 0xCAB0C9,
        chorus_fruit_wine:     0x6B3A8C,
    }

    Object.keys(fluids).forEach(name => {
        const color = fluids[name]
        const displayName = name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
        event.create(name, 'thin')
            .displayName(displayName)
            .tint(color)
            .type(typeBuilder => typeBuilder.tint(color))
    })
})
