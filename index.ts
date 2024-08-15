import * as fs from "fs";
import * as path from "path";

interface User {
  name: string;
  email: string;
  id: number;
}

interface SampleData {
  text: string;
  account_email: string | null;
  email: string | null;
}

interface OutputData {
  recognized: { user_email: string; related_emails: string[] }[];
  not_recognized: string[];
}

function loadJSONFile<T>(filePath: string): T {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

function saveJSONFile<T>(filePath: string, data: T) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function generatePossibleEmailPatterns(userEmail: string): RegExp[] {
  const [localPart, domain] = userEmail.split("@");
  const patterns = [];

  // Split the local part into fragments based on dots and other separators
  const fragments = localPart.split(/[\.\-_]/);

  // Create patterns by combining fragments and allowing any characters between them
  for (let i = 0; i < fragments.length; i++) {
    const pattern =
      fragments.slice(0, i + 1).join("[\\w\\-\\.]*") + "[\\w\\-\\.]*";
    patterns.push(new RegExp(`${pattern}@[\\w\\-\\.]+`, "i"));
  }

  return patterns;
}

function processEmails(users: User[], sampleData: SampleData[]): OutputData {
  const recognized: { user_email: string; related_emails: string[] }[] = [];
  const notRecognized: string[] = [];

  sampleData.forEach((sample) => {
    const emailToCheck = sample.email || sample.account_email;
    if (!emailToCheck) return;

    let found = false;

    for (const user of users) {
      const emailPatterns = generatePossibleEmailPatterns(user.email);

      for (const pattern of emailPatterns) {
        if (pattern.test(emailToCheck)) {
          const recognizedEntry = recognized.find(
            (entry) => entry.user_email === user.email
          );
          if (recognizedEntry) {
            recognizedEntry.related_emails.push(emailToCheck);
          } else {
            recognized.push({
              user_email: user.email,
              related_emails: [emailToCheck],
            });
          }
          found = true;
          break;
        }
      }

      if (found) break;
    }

    if (!found) {
      notRecognized.push(emailToCheck);
    }
  });

  return { recognized, not_recognized: notRecognized };
}

function main() {
  const usersFilePath = path.join(__dirname, "users.json");
  const sampleDataFilePath = path.join(__dirname, "sample_data.json");
  const outputFilePath = path.join(__dirname, "output.json");

  const users = loadJSONFile<User[]>(usersFilePath);
  const sampleData = loadJSONFile<SampleData[]>(sampleDataFilePath);

  const outputData = processEmails(users, sampleData);

  saveJSONFile(outputFilePath, outputData);
}

main();
