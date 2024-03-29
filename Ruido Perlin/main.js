/**
 * Original code from https://github.com/josephg/noisejs/blob/master/perlin.js
 */

class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
Vector2D.from = function(x, y) {
    return new Vector2D(x, y);
}
Vector2D.clone = function(vector) {
    return new Vector2D(vector.x, vector.y);
}
Vector2D.prototype.map = function(callbackFn) {
    for ([key, value] of Object.entries(this)) {
        this[key] = callbackFn(value);
    }
    return this;
}
Vector2D.prototype.substract = function(vector) {
    return new Vector2D(this.x-vector.x, this.y-vector.y);
}
Vector2D.prototype.dotProduct = function(x, y) {
    return this.x*x + this.y*y;
}


class Vector3D extends Vector2D {
    constructor(x, y, z) {
        super(x, y);
        this.z = z;
    }
}

class Noise {
    constructor() {
        this.setSeed();
    }
}
Noise.prototype.permutationTable = [
    151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];
Noise.prototype.extendedPermutationTable = new Array(512);
Noise.prototype.extendedGradientPermutationTable = new Array(512);
Noise.gradient3D = [
    new Vector3D(1,1,0),new Vector3D(-1,1,0),new Vector3D(1,-1,0),new Vector3D(-1,-1,0),
    new Vector3D(1,0,1),new Vector3D(-1,0,1),new Vector3D(1,0,-1),new Vector3D(-1,0,-1),
    new Vector3D(0,1,1),new Vector3D(0,-1,1),new Vector3D(0,1,-1),new Vector3D(0,-1,-1)
];
Noise.skewingFactor2D = 0.5*(Math.sqrt(3)-1);
Noise.unskewingFactor2D = (3-Math.sqrt(3))/6;
Noise.skewingFactor3D = 1/3;
Noise.unskewingFactor3D = 1/6;
Noise.prototype.scaleSeed = function(seed) {
    if (seed > 0 && seed < 1)
        seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256)
        seed |= seed << 8;
    return seed;
};
Noise.prototype.setPermutationTableValue = function(position) {
    if (position & 1) {
        return this.permutationTable[position] ^ (this.seed & 255);
    } else {
        return this.permutationTable[position] ^ ((this.seed >> 8) & 255);
    }
};
Noise.prototype.generatePermutationValues = function() {
    let currentPermutationTableIndex = 0;
    let permutationTableLength = 256;
    let permutationTableValue;

    while (currentPermutationTableIndex < permutationTableLength) {
        permutationTableValue = this.setPermutationTableValue(currentPermutationTableIndex);
        this.extendedPermutationTable[currentPermutationTableIndex]
            = this.extendedPermutationTable[currentPermutationTableIndex + 256]
                = permutationTableValue;
        this.extendedGradientPermutationTable[currentPermutationTableIndex]
            = this.extendedGradientPermutationTable[currentPermutationTableIndex + 256]
                = Noise.gradient3D[permutationTableValue % 12];
        currentPermutationTableIndex++;
    }
};
Noise.prototype.setSeed = function(seed) {
    seed = seed || 1337;
    this.seed = this.scaleSeed(seed);
    this.generatePermutationValues();
};
Noise.prototype.getHashedIndex = function(value) {
    return value &= 255;
};
Noise.prototype.fade = function(t) {
    return t**3*(t*(t*6-15)+10);
};
Noise.prototype.lerp = function(a, b, t) {
    return (1-t)*a + t*b;
};
Noise.prototype.getCornerNoiseContribution = function(gridVector, relativeVector, cornerVector) {
    return this.extendedGradientPermutationTable[
                gridVector.x
                + cornerVector.x
                + this.permutationTable[gridVector.y + cornerVector.y]
            ].dotProduct(
                relativeVector.x - cornerVector.x,
                relativeVector.y - cornerVector.y
            );
};
Noise.prototype.interpolateNoise = function(noiseCorners, fadeVector) {
    return this.lerp(
        this.lerp(noiseCorners["00"], noiseCorners["10"], fadeVector.x),
        this.lerp(noiseCorners["01"], noiseCorners["11"], fadeVector.x),
        fadeVector.y
    );
};
Noise.prototype.perlin2D = function(x, y) {
    let vector = Vector2D.from(x, y);

    let gridVector = Vector2D.clone(vector)
                             .map(Math.floor);

    let relativeVector = vector.substract(gridVector);

    gridVector.map(this.getHashedIndex);

    let noiseCorners = {
        "00": this.getCornerNoiseContribution(gridVector, relativeVector, Vector2D.from(0, 0)),
        "01": this.getCornerNoiseContribution(gridVector, relativeVector, Vector2D.from(0, 1)),
        "10": this.getCornerNoiseContribution(gridVector, relativeVector, Vector2D.from(1, 0)),
        "11": this.getCornerNoiseContribution(gridVector, relativeVector, Vector2D.from(1, 1)),
    };
    
    let fadeVector = Vector2D.clone(relativeVector)
                             .map(this.fade);

    return this.interpolateNoise(noiseCorners, fadeVector);
};

addEventListener("DOMContentLoaded", () => {
    let grid_size = 8;
    let canvas_resolution = 256;
    let resolution = 256;
    let pixel_size = Math.floor(canvas_resolution / resolution);
    let number_pixels = grid_size / resolution;
    
    let canvas = document.getElementById("ruido-perlin");
    let ctx = canvas.getContext("2d");
    canvas.width = canvas.height = canvas_resolution;
    let noise = new Noise();

    function paintNoise() {
        noise.setSeed(Date.now());
        let colour;
        for (let x = 0; x < grid_size; x += number_pixels) {
            for (let y = 0; y < grid_size; y += number_pixels) {
                colour = ((noise.perlin2D(x, y) + 1) * 255) / 2;
                ctx.fillStyle = `rgb(${colour}, ${colour}, ${colour})`;
                ctx.fillRect(
                    Math.floor(x / grid_size * resolution),
                    Math.floor(y / grid_size * resolution),
                    pixel_size,
                    pixel_size
                );
            }
        }
    }

    paintNoise();
    setInterval(paintNoise, 2500);
});