// Remove Create Nuclear's duplicate steel recipes — default the production path to Create Big Cannons.
//
// Both mods add steel via Create mixing, plus the usual 4-recipe storage cycle
// (nugget <-> ingot <-> block). AlmostUnified already collapses the items to
// CBC's steel ingot as the canonical c:ingots/steel, but the recipes themselves
// still show as separate JEI entries until removed.
//
// The mixing recipes are also intentionally different:
//   CBC: 2 iron + 1 coal -> 2 steel (heated)
//   CN:  1 iron + 1 coal dust -> 1 steel (no heat)
// Keeping CBC's keeps the heat requirement that makes steel feel like a tech step.

ServerEvents.recipes(event => {
    // --- Production (mixing) ---
    event.remove({ id: 'createnuclear:mixing/steel' })

    // --- Storage crafting: 9 nuggets <-> 1 ingot <-> 1 block, both directions ---
    event.remove({ id: 'createnuclear:crafting/crafting/steel_block_from_compacting' })
    event.remove({ id: 'createnuclear:crafting/crafting/steel_ingot_from_compacting' })
    event.remove({ id: 'createnuclear:crafting/crafting/steel_ingot_from_decompacting' })
    event.remove({ id: 'createnuclear:crafting/crafting/steel_nugget_from_decompacting' })

    // --- Duplicate-path variants present in the CN jar (same content, shorter path) ---
    event.remove({ id: 'createnuclear:crafting/steel_ingot_from_decompacting' })
    event.remove({ id: 'createnuclear:crafting/steel_nugget_from_decompacting' })
})
