function caselessCompare(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}

// This regex finds all wikilinks in a string
const wikilinkRegExp = /\[\[\s*([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s*\]\]/g

// https://davidwells.io/snippets/regex-match-markdown-links
// https://stephencharlesweiss.com/regex-markdown-link
// allow hypens
const mdlinkRegExp = /!?\[([^\]]*)?\]\(((https?:\/\/)?[A-Za-z0-9\:\/\.\- ]+)(\"(.+)\")?\)/gm

module.exports = function (options) {
    return ({ collections, page }) => {
        const { notes } = collections;

        // Remove /index, remove last trailing slash, remove everything before and including last slash
        const fileStem = page.filePathStem.replace('/index', '').replace(/\/$/, '').replace(/^(.*[\\\/])/, '');

        let backlinks = [];

        // Search the other notes for backlinks
        for (const otherNote of notes) {
            const noteContent = otherNote.template.frontMatter.content;

            // Get all links from otherNote
            const outboundLinks = (noteContent.match(wikilinkRegExp) || [])
                .map(link => (
                    // Extract link location
                    link.slice(2, -2)
                        .split("|")[0]
                        .replace(/\.(md|mkd|markdown|html|htm)\s*$/i, "")
                        .replace(`/${options.folder}/`, '')
                        .trim()
                ))
            .concat((noteContent.match(mdlinkRegExp) || [])
                .map(link => (
                    // Extract link location
                    /!?\[([^\]]*)\]\(([^\)]+)\)/gm.exec(link)[2]
                        .replace(/\.(md|mkd|markdown|html|htm)\s*$/i, "")
                        .replace('/index', '')
                        .replace(/\/$/, '')
                        .replace(/^(.*[\\\/])/, '')
                        .trim()
                )));

            // If the other note links here, return related info
            if (outboundLinks.some(link => caselessCompare(link, fileStem))) {
                backlinks.push(options.getData(otherNote));
            }
        }
        return backlinks;
    }
}
