For the website that users would interact with: https://mtrieg.github.io/World-of-chaos/WOC_demo/
clicking allows you to select a country, and thus easily see who they were friends with

For the backend code, see the javasript_backend. Note that it was incredibly optimized towards the specific file formats that were created for this game.

Lastly, this code was originally created with the intent to eventually be added to the game creator's server. However, the game creators had enough trouble running this game because 
there were more players than ever before and that broke their server code in ways they did not expect, hence they didn't have the mental bandwidth to automate collecting information about informal 
alliances. I originally planned to continue this myself until the administrators had time and we could work towards integrating my code with their discord bot, so my first version was prioritizing quick development over readability.
Hence why there's inconsistencies like main.js being primarily an export and svg_update and updateMappingsAlliance being the js commands I'd actually call in my manual calling.
However, they never were able to get back to me and the player who was my primary source for alliances was eliminated. I didn't have time to ask all 300 players myself, so the project stopped being maintained from then on.
