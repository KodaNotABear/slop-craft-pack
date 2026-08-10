// Connect each Brewin' and Chewin' drink item to its KubeJS fluid (registered in
// startup_scripts/brewinandchewin_fluid.js) through Create, so the new buckets are
// actually obtainable in survival.
//
//   EMPTYING (Item Drain): drink item       -> 250mb fluid + empty Tankard
//   FILLING  (Spout):      Tankard + fluid  -> drink item
//
// The Tankard is B&C's reusable vessel: drinking a beverage already returns a Tankard
// (the drink items use craftRemainder(TANKARD)), so draining one mirrors drinking it
// exactly — you get the Tankard back, no duplication. 250mb per drink matches the mod's
// own keg pouring amount, so a full bucket (1000mb) fills/empties 4 drinks.
//
// If you only want the standalone buckets/placeables and not the Create conversions,
// delete this file — the startup script is fully independent of it.

ServerEvents.recipes(event => {
    const TANKARD = 'brewinandchewin:tankard'
    const drink = name => Fluid.of(`kubejs:${name}`, 250)
    // brewinandchewin:<name> exists as BOTH an item and a fluid (the mod's internal keg
    // fluid), and a bare "brewinandchewin:<name>" string resolves to the fluid — which
    // breaks emptying/filling (they'd see a fluid where an item is required). Item.of(...)
    // forces the drink *item* to be used.
    const drinkItem = name => Item.of(`brewinandchewin:${name}`)

    const drinks = [
        'beer',
        'vodka',
        'mead',
        'egg_grog',
        'strongroot_ale',
        'rice_wine',
        'glittering_grenadine',
        'steel_toe_stout',
        'dread_nog',
        'kombucha',
        'saccharine_rum',
        'pale_jane',
        'salty_folly',
        'bloody_mary',
        'red_rum',
        'withering_dross',
    ]

    drinks.forEach(name => {
        // Item Drain: drink -> fluid + empty tankard
        event.recipes.create.emptying(
            [drink(name), TANKARD],
            drinkItem(name)
        )
        // Spout: tankard + fluid -> drink
        event.recipes.create.filling(
            drinkItem(name),
            [TANKARD, drink(name)]
        )
    })
})
