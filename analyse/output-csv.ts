import { makePath } from "./shared";
import { FormattedRecord } from "./types";
import csv from "csv/sync";
import fs from "fs";

const writeCsvFile = (name: string, content: FormattedRecord[]) => {
  const csvContent = csv.stringify(content, { header: true });
  fs.writeFileSync(name, csvContent, "utf-8");
};

const outputCSV = (name: string, content: FormattedRecord[]) => {
  return writeCsvFile(makePath("outputs", `${name}.csv`), content);
};

export default outputCSV;
