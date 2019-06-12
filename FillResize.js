// Resizing image
import sharp from 'sharp';
import uuidv4 from 'uuid/v4';
import path from 'path';

class FillResize {
    // Folder path up to images
    constructor(folder) {
        this.folder = folder;
    }
    // Accept file buffer coming from user request
    async save(buffer) {
        const filename = Resize.filename();
        const filepath = this.filepath(filename);
        // Resize image and upload to filepath
        await sharp(buffer).resize(300, 300, {
            fil: sharp.fit.fill,
            withoutEnlargement: true
        }).toFile(filepath);
        // Return filenamet to user
        return filename;
    }
    // Return random string of filename
    static filename() {
        return `${uuidv4()}.png`;
    }
    // Complete filepath of uploaded image
    filepath(filename) {
        return path.resolve(`${this.folder}/${filename}`);
    }
}

export default FillResize;
