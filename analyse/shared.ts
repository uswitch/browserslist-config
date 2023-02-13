import path from "path";

export const makePath = (...filepaths: string[]) => path.join(__dirname, ...filepaths);
