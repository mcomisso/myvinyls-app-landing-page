---
layout: post
title: "How to create folders and move records in My Vinyl"
description: "Use My Vinyl's Android folder controls to match records to shelf locations. Create a folder, move one copy, and learn which Delete action to avoid."
date: 2026-11-16 05:30:10 +0000
category: app-tips
tags: [my-vinyl, folder-management, record-organization, shelf-locations, collection-management, app-guide]
author: Matteo Comisso
reading_time: 6
image: /assets/blog/images/2026-11-16-my-vinyl-manage-folders.webp
image_alt: "Two wooden compartments hold upright record jackets on a cabinet, with a black phone lying face down in front."
---

Knowing I own an album does not tell me which shelf holds it. If the collection entry is correct but the record has moved to another room, searching the title again will not solve the problem. I need the entry and the physical location to agree.

My Vinyl's folders can give that location a name. This guide follows the Android beta's folder screen, English labels, navigation, and move logic. The public iOS release history mentions improved folder management in version 4.5.1, but that does not establish identical controls on both platforms.[1]

I would start with one shelf and one record. Create a location folder, move the entry, then put the sleeved record in the corresponding place. That is a small enough test to finish before reorganizing a whole collection.

## Choose what a folder name means

For this exercise, use folders for physical locations. Names such as "Living room left" and "Office shelf" are examples I would choose, not folders the app creates for you. Use wording you will still understand when you are looking for a record months later.

Avoid mixing locations and listening plans in the same small set of folders. "Office shelf" answers where a copy lives. "Listen next" answers a different question, and moving a record between those names would make its location unclear. Choose the job you want these folders to do before entering names.

The reason to keep the connection explicit is practical. The Canadian Conservation Institute identifies the loss of an accession number or associated information as a dissociation risk for recorded media.[2] A home shelf name is not an institutional accession system, but I would borrow the discipline of keeping information connected to the object it describes.

## Create one destination in Manage Folders

Folder management requires premium access in the Android feature policy. If opening it takes you to the upgrade screen, that is an access restriction, not evidence that your collection has no folders. You also need to be signed in for the folder requests to run.

With access available, use this sequence:

1. Open your Collection and tap the folder selector above the records. It shows your current destination, which may be All or an existing folder name.
2. Choose Manage Folders from that menu. This opens the management screen rather than merely filtering the collection.
3. Tap the plus button at the top. Its accessibility label is Create Folder.
4. Enter your location in the Folder name field. The Create button stays disabled while the field is blank.
5. Tap Create, then check that the new name appears in the folder list before moving anything into it.

I would create only the destination needed for the first move. The management list sorts folders by name, so a consistent naming convention helps you find related locations together. There is no need to invent names for shelves you have not checked yet.

## Move one collection copy

On Manage Folders, expand the folder that currently holds the record using its chevron. Each displayed record has its own three-dot options button. Open that button and choose the destination name under Move to.

The Android move action includes the collection copy's instance identifier as well as its release identifier and source folder. It targets that collection entry rather than issuing a command to move every copy of an album. If you own duplicates, check which entry you are selecting before you tap the destination.

After a successful move request, the management logic reloads the source and destination and refreshes the folder counts. Check the destination for the entry before treating the move as finished. A closed menu alone does not tell you that the request succeeded.

Then move the sleeved record to the matching physical location. For a first test, I would keep the record beside me until the app shows the destination correctly, then file it. If the request produces an error, resolve that before processing the next record so you do not build up a batch of uncertain locations.

## Separate browsing from changing membership

The folder name and the expansion chevron do different jobs. Tapping the name opens that folder's record-browsing screen. Expanding the card keeps you in Manage Folders and exposes record rows with their move options.

Inside the browsing screen, the magnifying-glass button opens a Search in folder field. A sort control and direction button change the displayed order. Those are browsing controls, not instructions to transfer entries between folders.

There is a limitation worth knowing before an audit. The current management-screen loader requests the first page of up to 100 records for an expanded folder. Its visible rows are therefore not a reliable complete inventory of a larger folder. If the record you need is not among them, return to Collection and select that source folder rather than conclude that the copy has disappeared.

A request to load those preview rows can also fail without showing a separate error there. I would not read an empty expanded preview as proof that a populated folder contains nothing. Check the folder count and refresh before drawing that conclusion.

## Rename and delete with different intentions

A folder's three-dot menu offers Rename and Delete. Rename opens a dialog with the existing name filled in. Enter the replacement and tap Rename, then check the updated list. Changing "Office shelf" to "Office cabinet" does not move the physical records for you.

Delete is for retiring an empty folder. The confirmation dialog disables deletion while its count is above zero and says the folder must be empty first. Move its records to their new destinations, verify those moves, and only then remove the unused folder.

Do not confuse that with Delete from collection in an individual record's options. That action asks for confirmation and removes the entry from the collection. It is not a shortcut for moving the record out of its current folder, so cancel it if your intention is only to refile a copy.

## Finish the shelf check before starting another

A folder location does not describe condition. If you notice wear while refiling, use the separate workflow in the Journal's [guide to saving record and sleeve conditions in My Vinyl](/blog/2026/11/my-vinyl-record-sleeve-conditions/). Keep the shelf destination and the condition assessment as different pieces of information.

Keep the physical work modest too. The Library of Congress recommends storing grooved discs upright with sturdy support and handling them by their edges and label areas.[3] I would leave records in their jackets for this location check rather than pull out every disc or build a flat sorting pile on the floor.

Choose one sleeved record whose location is uncertain. Make its folder entry agree with where you actually file it, then retrieve it once using that name. If that works, repeat the same procedure for the rest of that shelf before creating another destination.

## Sources

[1] [My Vinyl+: Release history, version 4.5.1 folder-management improvements](https://myvinyls.app/changelog/)

[2] [Canadian Conservation Institute: Caring for audio, video and data recording media, theft, vandalism, and dissociation](https://www.canada.ca/en/conservation-institute/services/preventive-conservation/guidelines-collections/caring-audio-video-data-recording-media.html#a2b2)

[3] [Library of Congress: Care, Handling, and Storage of Audio Visual Materials](https://www.loc.gov/preservation/care/record.html)
