const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const JDK_URL = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.8.1%2B1/OpenJDK17U-jdk_x64_linux_hotspot_17.0.8.1_1.tar.gz';
const BIN_DIR = path.join(__dirname, '..', 'bin');
const JDK_DIR = path.join(BIN_DIR, 'jdk17');

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Follow HTTP Redirects recursively
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
            file.on('error', (err) => {
                file.close();
                fs.unlink(dest, () => { });
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const installJdk = async () => {
    if (process.platform === 'win32') {
        console.log('Skipping JDK installation on Windows.');
        return;
    }

    if (fs.existsSync(path.join(JDK_DIR, 'bin', 'javac'))) {
        console.log('JDK is already installed.');
        return;
    }

    console.log('JDK not found, downloading portable JDK for Render...');
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
    }

    const tarPath = path.join(BIN_DIR, 'jdk.tar.gz');
    try {
        console.log(`Downloading OpenJDK from ${JDK_URL}...`);
        await downloadFile(JDK_URL, tarPath);

        console.log('Extracting JDK...');
        execSync(`tar -xzf "${tarPath}" -C "${BIN_DIR}"`, { stdio: 'inherit' });

        const dirs = fs.readdirSync(BIN_DIR).filter(f => f.startsWith('jdk-') && fs.statSync(path.join(BIN_DIR, f)).isDirectory());
        if (dirs.length > 0) {
            if (fs.existsSync(JDK_DIR)) {
                fs.rmSync(JDK_DIR, { recursive: true, force: true });
            }
            fs.renameSync(path.join(BIN_DIR, dirs[0]), JDK_DIR);
            console.log(`Successfully renamed ${dirs[0]} to jdk17`);
        } else {
            throw new Error('No extracted jdk- directory found in bin');
        }

        console.log('JDK installed successfully at:', JDK_DIR);
    } catch (err) {
        console.error('Failed to download/install JDK:', err);
        process.exit(1); // Exit with non-zero code to fail the build explicitly
    } finally {
        if (fs.existsSync(tarPath)) {
            try {
                fs.unlinkSync(tarPath);
            } catch (e) {
                // Ignore unlink errors
            }
        }
    }
};

installJdk();
