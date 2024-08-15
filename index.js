"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
function loadJSONFile(filePath) {
    var data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
}
function saveJSONFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}
function generatePossibleEmailPatterns(userEmail) {
    var _a = userEmail.split("@"), localPart = _a[0], domain = _a[1];
    var patterns = [];
    // Split the local part into fragments based on dots and other separators
    var fragments = localPart.split(/[\.\-_]/);
    // Create patterns by combining fragments and allowing any characters between them
    for (var i = 0; i < fragments.length; i++) {
        var pattern = fragments.slice(0, i + 1).join("[\\w\\-\\.]*") + "[\\w\\-\\.]*";
        patterns.push(new RegExp("".concat(pattern, "@[\\w\\-\\.]+"), "i"));
    }
    return patterns;
}
function processEmails(users, sampleData) {
    var recognized = [];
    var notRecognized = [];
    sampleData.forEach(function (sample) {
        var emailToCheck = sample.email || sample.account_email;
        if (!emailToCheck)
            return;
        var found = false;
        var _loop_1 = function (user) {
            var emailPatterns = generatePossibleEmailPatterns(user.email);
            for (var _a = 0, emailPatterns_1 = emailPatterns; _a < emailPatterns_1.length; _a++) {
                var pattern = emailPatterns_1[_a];
                if (pattern.test(emailToCheck)) {
                    var recognizedEntry = recognized.find(function (entry) { return entry.user_email === user.email; });
                    if (recognizedEntry) {
                        recognizedEntry.related_emails.push(emailToCheck);
                    }
                    else {
                        recognized.push({
                            user_email: user.email,
                            related_emails: [emailToCheck],
                        });
                    }
                    found = true;
                    break;
                }
            }
            if (found)
                return "break";
        };
        for (var _i = 0, users_1 = users; _i < users_1.length; _i++) {
            var user = users_1[_i];
            var state_1 = _loop_1(user);
            if (state_1 === "break")
                break;
        }
        if (!found) {
            notRecognized.push(emailToCheck);
        }
    });
    return { recognized: recognized, not_recognized: notRecognized };
}
function main() {
    var usersFilePath = path.join(__dirname, "users.json");
    var sampleDataFilePath = path.join(__dirname, "sample_data.json");
    var outputFilePath = path.join(__dirname, "output.json");
    var users = loadJSONFile(usersFilePath);
    var sampleData = loadJSONFile(sampleDataFilePath);
    var outputData = processEmails(users, sampleData);
    saveJSONFile(outputFilePath, outputData);
}
main();
