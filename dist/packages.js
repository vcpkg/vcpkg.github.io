
var triplets = [
    'arm-uwp',
    'arm64-windows',
    'x64-linux',
    'x64-osx',
    'x64-uwp',
    'x64-windows',
    'x64-windows-static',
    'x86-windows',
];

var sortAlphabetical = function (a, b) {
    var pkgA = a.Name.toUpperCase();
    var pkgB = b.Name.toUpperCase();
    return pkgA >= pkgB ? 1 : -1;
};
var sortStars = function (a, b) {
    return (b.Stars || 0) - (a.Stars || 0);
};

function searchRankFor(query) {
    return (a, b) => {
        let packages = [a, b];
        let scores = [0, 0];

        for (let i = 0; i < 2; i++) {
            let score = 0;
            let pkg = packages[i];

            // Exact match
            if (pkg.Name === query) {
                score += 1000;
            }

            // Prefix match
            if (pkg.Name.indexOf(query) == 0) {
                score += 500;
            }

            // Substring
            if (pkg.Name.indexOf(query) != -1) {
                score += 100;
            }

            //Description
            if (pkg.Description && pkg.Description.indexOf(query) != -1) {
                score += 50;
            }
            scores[i] = score;
        }
        return scores[1] - scores[0];
    };
}

