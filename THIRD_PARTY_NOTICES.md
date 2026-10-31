# Third-party notices and asset provenance

The root [MIT license](LICENSE) covers project code. It does not override another contributor's copyright or a third-party license. Public source availability is not evidence that unrelated media is CC0 or public domain.

## Decentraland UI sounds

Three unchanged UI clips are copied from `decentraland/unity-explorer`, commit `f051335d7758c6c89a9cdc0c6e72a437b12536b7`. Attribution and original filenames are recorded in [the sound directory](assets/Audio/ui/native/README.md). They retain **Apache License 2.0**; see [the included license](licenses/decentraland-unity-explorer-Apache-2.0.txt).

## SDK and npm dependencies

Dependency versions are recorded in `package-lock.json`. Each dependency retains its own license and notices. Dependencies are installed with `npm ci`, not vendored through `node_modules`.

## Agent guidance

`.agents/skills/` contains the previously integrated guidance from [decentraland/sdk-skills](https://github.com/decentraland/sdk-skills), whose [upstream license](https://github.com/decentraland/sdk-skills/blob/main/LICENSE) is **Apache License 2.0** (verified 2026-10-25). That license, rather than the project's MIT license, applies to the upstream guidance; the Apache license text is [included locally](licenses/decentraland-unity-explorer-Apache-2.0.txt). No exact upstream revision was recorded when the skills were originally integrated, so the files are not presented as a synchronized latest release. They are development documentation, not runtime game content. The GDD structure follows the template linked from [official onboarding](https://docs.decentraland.org/creator/studio-onboarding), checked 2026-10-25.

## Project art and audio

- The sci-fi frame/fill PNGs are original procedural geometry and gradients authored in `scripts/Generate-SciFiSkins.ps1`; the generated approval sheet remains an art-source reference, not a cropped asset source.
- Astronaut, seat, environment and atlas files were supplied by the creator for this game. Final ownership/redistribution declaration and any external atlas-source permissions: **TBD with the creator**.
- Logo/card visuals were generated for the project; their prompt record is in [Generated UI Art Prompts](docs/ART_PROMPTS.md). Generated concepts are references, not proof of a final production model or exclusivity.
- Music was supplied to the project. Composer/source and redistribution permission: **TBD with the creator**. Do not describe it as royalty-free without the actual permission record.
- Any future contributed asset must include its author/source and license or explicit redistribution permission before integration.

These pending provenance declarations must be resolved before presenting the build as cleared for a public program release. They are not evidence of infringement, and they do not grant asset users rights the project does not hold.
