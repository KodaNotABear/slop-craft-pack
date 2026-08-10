// Hide the redundant raw kubejs: drink fluids from JEI's ingredient list.
//
// Each Brewin' and Chewin' drink now has TWO fluids registered:
//   - brewinandchewin:<name>  the mod's internal Keg fluid (no bucket, not placeable;
//                             must stay visible — the Keg's JEI fermenting/pouring pages
//                             use it)
//   - kubejs:<name>           our fluid that backs the new bucket + placeable block
// They share a display name, so JEI showed two identical "Beer" (etc.) fluids. This hides
// OUR raw fluid from JEI's ingredient panel. The "<Drink> Bucket" item stays visible, and
// placing / emptying / filling all keep working — this only removes the entry from the
// searchable list (recipes that use the fluid still render it).
//
// Client-side change: apply with a client resource reload (F3+T) or a game restart;
// a plain /reload (server data) won't rebuild JEI's list.

RecipeViewerEvents.removeEntries('fluid', event => {
    const drinks = [
        'beer', 'vodka', 'mead', 'rice_wine', 'egg_grog', 'strongroot_ale',
        'saccharine_rum', 'pale_jane', 'salty_folly', 'steel_toe_stout',
        'glittering_grenadine', 'bloody_mary', 'red_rum', 'withering_dross',
        'dread_nog', 'kombucha',
    ]
    drinks.forEach(name => event.remove(Fluid.of(`kubejs:${name}`)))
})
