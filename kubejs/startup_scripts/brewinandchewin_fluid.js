// Register fluid forms for every Brewin' and Chewin' drink. Each 'event.create' yields
// three things automatically:
//   - kubejs:<name>         the placeable fluid (source + flowing block, scoopable by bucket)
//   - kubejs:<name>_bucket  a bucket item that places / picks the fluid back up
//   - the fluid itself (usable in tanks, Create, etc.)
//
// B&C already registers an internal FluidType per drink for use *inside Kegs*, but those
// have no bucket and can't be placed in the world. These KubeJS fluids fill that gap.
// They live in the kubejs: namespace, so they don't collide with brewinandchewin:<name>.
//
// Tints are the mod's own hard-coded keg fluid colors (BnCFluidConstants.Colors), so the
// buckets and placed fluid match what each drink looks like inside a Keg. egg_grog and
// rice_wine are 0xFFFFFF in the mod (pale/creamy) — that's intentional, not a placeholder.
// All drinks are 'thin' (water-like) fluids; KubeJS tints its built-in thin textures so no
// custom textures are needed.
//
// NOTE: this is a startup script — adding/removing drinks here requires a full game
// restart (not just /reload) to re-register the fluids.

StartupEvents.registry('fluid', event => {
    const fluids = {
        beer:                 0xFBB117,
        vodka:                0xE7FDF6,
        mead:                 0xFFD32D,
        egg_grog:             0xFFFFFF,
        strongroot_ale:       0xBC4A4F,
        rice_wine:            0xFFFFFF,
        glittering_grenadine: 0xF5A55E,
        steel_toe_stout:      0x978B8C,
        dread_nog:            0x25DAB7,
        kombucha:             0x929238,
        saccharine_rum:       0xCD4A7A,
        pale_jane:            0xD8BEAB,
        salty_folly:          0x38672D,
        bloody_mary:          0x84160D,
        red_rum:              0x521810,
        withering_dross:      0x191411,
    }

    // Display names that aren't a plain title-case of the id (matches the mod's lang file).
    const displayNames = {
        steel_toe_stout: 'Steel-Toe Stout',
    }

    Object.keys(fluids).forEach(name => {
        const color = fluids[name]
        const displayName = displayNames[name]
            || name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
        event.create(name, 'thin')
            .displayName(displayName)
            .tint(color)
            .type(typeBuilder => typeBuilder.tint(color))
    })
})
