# Release checklist

The package remains private under its local identity. Choose a GitHub owner/repository, npm package identity, author metadata and target marketplace before release. Update package name, bundle row name, Client module ID and configuration slot key together. Remove private:true only for an intentional publication.

Run tests, inspect npm pack output, install the pack into a clean profile, and verify actual UI. Include no personal profiles, paths, keys, ledgers, backups or runtime extracts. Add the GitHub topic dsh-plugin. Publish manually after review; CI must not publish automatically.

The marketplace generator accepts a real HTTPS Git repository URL, immutable lowercase 40-character SHA, output index URL and unpacked DSH runtime path. Validate against that runtime's plugin-market-index library. Its valid format-1 index is preparation only: check the selected public index's current submission/review procedure separately. Package and index versions/engines must match. Git install targets must pin the commit. GitHub/npm identity and listing acceptance are not established by generating an index.
