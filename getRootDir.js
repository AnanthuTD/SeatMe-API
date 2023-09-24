import path from 'path';
import { fileURLToPath } from 'url';

export default () => {
    const filenameUrl = import.meta.url;
    const rootDir = path.dirname(fileURLToPath(filenameUrl));

    return rootDir;
};
