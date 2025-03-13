const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

var inp = document.getElementById('inp');

var objs = [];
ctx.fillStyle = 'white';

var groups = [];

let colors = {
    red: '255,0,0,1',
    green: '0,255,0,1',
    blue: '0,0,255,1'
}

var lights = [];

class obj {
    constructor(id, x, y, w, h, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.instantiate();
        this.draw();
    }
    instantiate() {
        objs.push(this);
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

class light {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = 20;
        this.h = 20;
        this.color = 'rgba(255, 255, 255, 1)';
        this.brightness = 100;

        this.pulsing = false;
        this.pulseSpeed = 0;
        this.rising = false;

        this.draw();
        this.instantiate();
    }
    instantiate() {
        objs.push(this);
        lights.push(this);
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    setBrightness(b) {
        let tempRGB = this.color;
        tempRGB = tempRGB.replace('rgba(', '').replace(')', '').replace(' ', '').split(',');
        this.color = 'rgba(' + tempRGB[0] + ',' + tempRGB[1] + ',' + tempRGB[2] + ',' + b / 100 + ')';
    }
    update() {
        if (this.pulsing) {
            if (this.brightness > 0 && !this.rising) {
                this.brightness -= this.pulseSpeed;
                this.setBrightness(this.brightness);
            }
            else {
                this.rising = true;
                this.brightness += this.pulseSpeed;
                this.setBrightness(this.brightness);
                if (this.brightness >= 100)
                    this.pulsing = false;
            }
        }
    }
    pulse(speed) {
        this.pulseSpeed = speed;
        this.pulsing = true;
        this.rising = false;
    }
}

class tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.fixtures = [];
        this.objs = [];
        this.effect = 'none';
        this.brightness = 100;
        this.rising = false;
        this.effect = {
            name: 'none',
            position: 0,
            row: 0,
            column: 0,
            speed: 10,
            direction: 'forward',
        }
        this.instantiate();
    }
    instantiate() {
        this.fixtures[0] = [], this.fixtures[1] = [];
        for (var i = 0; i < 5; i++) {
            this.fixtures[0].push(new light(objs.length, i * 30 + this.x, this.y));
            this.objs.push(new obj(this.objs.length, i * 30 + this.x - 2, this.y - 2, 24, 24, 'rgba(255, 255, 255, 0.05)'));
        }
        for (var i = 0; i < 4; i++) {
            this.fixtures[1].push(new light(objs.length, i * 30 + this.x + 15, this.y + 30));
            this.objs.push(new obj(this.objs.length, i * 30 + this.x + 15 - 2, this.y + 30 - 2, 24, 24, 'rgba(255, 255, 255, 0.05)'));
        }
    }
    setAllColors(color, brightness) {
        let c = color.split(',');
        c[3] = brightness / 100;
        for (var i = 0; i < this.fixtures.length; i++) {
            for (var j = 0; j < this.fixtures[i].length; j++) {
                this.fixtures[i][j].color = 'rgba(' + c + ')';
            }
        }
    }
    setFixture(row, column, color, brightness) {
        let c = color.split(',');
        c[3] = brightness / 100;
        this.fixtures[row][column].color = "rgba(" + c + ")";
        this.fixtures[row][column].brightness = brightness;
    }
    update() {
        for (var i = 0; i < this.fixtures.length; i++) {
            for (var j = 0; j < this.fixtures[i].length; j++) {
                this.fixtures[i][j].update();
            }
        }

        if (this.brightness == 100)
            this.rising = false;
        else if (this.brightness == 0)
            this.rising = true;
        if (this.brightness > 0 && !this.rising)
            this.brightness--;
        else
            this.brightness++;

        this.last = 0;
        if (this.effect.name == 'bounce') {
            //Basic test effect
            let tempB = this.brightness;
            let count = 0;
            for (var i = 0; i < this.fixtures.length; i++) {
                for (var j = 0; j < this.fixtures[i].length; j++) {
                    let tempRGB = this.fixtures[i][j].color + '';
                    tempRGB = tempRGB.replace('rgba(', '').replace(')', '').split(',');
                    let tempColor = tempRGB[0] + ',' + tempRGB[1] + ',' + tempRGB[2] + ',1';
                    tempB -= count * 2;
                    this.setFixture(i, j, tempColor, tempB);
                    count++;
                }
            }
        }
        else if (this.effect.name == 'sawtooth') {
            //Tell a light to pulse, and when it's done, pulse the next one
            if (!this.fixtures[this.effect.row][this.effect.column].pulsing) {
                this.fixtures[this.effect.row][this.effect.column].pulse(this.effect.speed);
            }
            if (this.fixtures[this.effect.row][this.effect.column].rising) { //Move to the next light
                if ((this.effect.column < this.fixtures[this.effect.row].length - 1 && this.effect.direction == 'forward') || (this.effect.column > 0 && this.effect.direction == 'reverse')) {
                    if (this.effect.direction == 'forward')
                        this.effect.column++;
                    else
                        this.effect.column--;
                }
                else {
                    if (this.effect.row < this.fixtures.length - 1)
                        this.effect.row++
                    else
                        this.effect.row = 0;
                    if (this.effect.direction == 'forward') {
                        this.effect.column = this.fixtures[this.effect.row].length - 1;
                        this.effect.direction = 'reverse';
                    }
                    else {
                        this.effect.column = 0;
                        this.effect.direction = 'forward';
                    }
                }
            }
        }
        else if (this.effect.name == 'sine') {

        }
    }
    setEffect(effect, speed, direction, row, column) {
        this.effect.name = effect;
        this.effect.speed = speed;
        this.effect.direction = direction;
        this.effect.row = row;
        this.effect.column = column;
    }
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < lights.length; i++) {
        lights[i].draw();
    }
    for (var i = 0; i < objs.length; i++) {
        objs[i].draw();
    }
}

var effects = [];
function runEffects() {
    for (var e = 0; e < effects.length; e++) { //Runs through every active effect
        for (var i = 0; i < effects[e][0].length; i++) { //Run through each light in the effect group
            let id = effects[e][0][i];
            let name = effects[e][1];
            let speed = effects[e][2];
            let direction = effects[e][3];
            if (!objs[effects[e][0][effects[e][5]]].pulsing) {
                objs[effects[e][0][effects[e][5]]].pulse(speed);
            }
            if (objs[effects[e][0][effects[e][5]]].rising) {
                if (direction == 'forward') {
                    if (effects[e][5] < effects[e][0].length - 1)
                        effects[e][5]++;
                    else
                        effects[e][5] = 0;
                }
                else {
                    if (effects[e][5] > 0)
                        effects[e][5]--;
                    else
                        effects[e][5] = effects[e][0].length - 1;
                }
            }
        }
    }
}

let rightTree = new tree(20, 20);
let middleTree = new tree(290, 20);
let leftTree = new tree(560, 20);

// LIGHT GROUPS SECTION

groups.push(['All Trees DMX', [], 'blue']);
for (var i = 0; i < rightTree.fixtures[0].length; i++) {
    groups[groups.length - 1][1].push(rightTree.fixtures[0][i].id * 1);
    groups[groups.length - 1][1].push(middleTree.fixtures[0][i].id * 1);
    groups[groups.length - 1][1].push(leftTree.fixtures[0][i].id * 1);
}
for (var i = 0; i < rightTree.fixtures[1].length; i++) {
    groups[groups.length - 1][1].push(rightTree.fixtures[1][i].id);
    groups[groups.length - 1][1].push(middleTree.fixtures[1][i].id);
    groups[groups.length - 1][1].push(leftTree.fixtures[1][i].id);
}


groups.push(['Right Tree All DMX', [], 'aqua']);
for (var i = 0; i < rightTree.fixtures[0].length; i++) {
    groups[groups.length - 1][1].push(rightTree.fixtures[0][i].id);
}
for (var i = 0; i < rightTree.fixtures[1].length; i++) {
    groups[groups.length - 1][1].push(rightTree.fixtures[1][i].id);
}
groups.push(['Middle Tree All DMX', [], 'aqua']);
for (var i = 0; i < middleTree.fixtures[0].length; i++) {
    groups[groups.length - 1][1].push(middleTree.fixtures[0][i].id);
}
for (var i = 0; i < middleTree.fixtures[1].length; i++) {
    groups[groups.length - 1][1].push(middleTree.fixtures[1][i].id);
}
groups.push(['Left Tree All DMX', [], 'aqua']);
for (var i = 0; i < leftTree.fixtures[0].length; i++) {
    groups[groups.length - 1][1].push(leftTree.fixtures[0][i].id);
}
for (var i = 0; i < leftTree.fixtures[1].length; i++) {
    groups[groups.length - 1][1].push(leftTree.fixtures[1][i].id);
}

groups.push(['Trees Top Row', [], 'lime']);
for (var i = 0; i < rightTree.fixtures[0].length; i++) {
    groups[groups.length - 1][1].push(rightTree.fixtures[0][i].id * 1);
    groups[groups.length - 1][1].push(middleTree.fixtures[0][i].id * 1);
    groups[groups.length - 1][1].push(leftTree.fixtures[0][i].id * 1);
}
groups.push(['Trees Bottom Row', [], 'lime']);
for (var i = 0; i < rightTree.fixtures[1].length; i++) {
    groups[groups.length - 1][1].push(rightTree.fixtures[1][i].id);
    groups[groups.length - 1][1].push(middleTree.fixtures[1][i].id);
    groups[groups.length - 1][1].push(leftTree.fixtures[1][i].id);
}

groups.push(['Top Row Odd', [], 'orange']);
for (var i = 0; i < rightTree.fixtures[0].length; i++) {
    if (i % 2 == 0) {
        groups[groups.length - 1][1].push(rightTree.fixtures[0][i].id);
        groups[groups.length - 1][1].push(middleTree.fixtures[0][i].id);
        groups[groups.length - 1][1].push(leftTree.fixtures[0][i].id);
    }
}
groups.push(['Top Row Even', [], 'orange']);
for (var i = 0; i < rightTree.fixtures[0].length; i++) {
    if (i % 2 != 0) {
        groups[groups.length - 1][1].push(rightTree.fixtures[0][i].id);
        groups[groups.length - 1][1].push(middleTree.fixtures[0][i].id);
        groups[groups.length - 1][1].push(leftTree.fixtures[0][i].id);
    }
}

groups.push(['Bottom Row Odd', [], 'orange']);
for (var i = 0; i < rightTree.fixtures[1].length; i++) {
    if (i % 2 == 0) {
        groups[groups.length - 1][1].push(rightTree.fixtures[1][i].id);
        groups[groups.length - 1][1].push(middleTree.fixtures[1][i].id);
        groups[groups.length - 1][1].push(leftTree.fixtures[1][i].id);
    }
}
groups.push(['Bottom Row Even', [], 'orange']);
for (var i = 0; i < rightTree.fixtures[1].length; i++) {
    if (i % 2 != 0) {
        groups[groups.length - 1][1].push(rightTree.fixtures[1][i].id);
        groups[groups.length - 1][1].push(middleTree.fixtures[1][i].id);
        groups[groups.length - 1][1].push(leftTree.fixtures[1][i].id);
    }
}

// END OF LIGHT GROUPS SECTION

let hollywoods = [];
let bar1 = new obj(objs.length, 80, 80, 20, 330, 'rgba(255, 255, 255, 0.075)');
hollywoods[0] = new light(objs.length, 102, 150); hollywoods[0].color = 'rgba(255, 200, 0, 0.5)';
hollywoods[1] = new light(objs.length, 102, 250); hollywoods[1].color = 'rgba(255, 200, 0, 0.5)';
hollywoods[2] = new light(objs.length, 102, 350); hollywoods[2].color = 'rgba(255, 200, 0, 0.5)';
let bar2 = new obj(objs.length, 350, 80, 20, 330, 'rgba(255, 255, 255, 0.075)');
hollywoods[3] = new light(objs.length, 372, 150); hollywoods[3].color = 'rgba(255, 200, 0, 0.5)';
hollywoods[4] = new light(objs.length, 372, 250); hollywoods[4].color = 'rgba(255, 200, 0, 0.5)';
hollywoods[5] = new light(objs.length, 372, 350); hollywoods[5].color = 'rgba(255, 200, 0, 0.5)';
let bar3 = new obj(objs.length, 620, 80, 20, 330, 'rgba(255, 255, 255, 0.075)');
hollywoods[6] = new light(objs.length, 642, 150); hollywoods[6].color = 'rgba(255, 200, 0, 0.5)';
hollywoods[7] = new light(objs.length, 642, 250); hollywoods[7].color = 'rgba(255, 200, 0, 0.5)';
hollywoods[8] = new light(objs.length, 642, 350); hollywoods[8].color = 'rgba(255, 200, 0, 0.5)';
groups.push(['Holly Woods All', [], 'gold']);
for (var i = 0; i < hollywoods.length; i++) {
    groups[groups.length - 1][1].push(hollywoods[i].id);
}

// Makes sure that all groups have their fixtures in ascending order
for (var i = 0; i < groups.length; i++)
{
    groups[i][1].sort((a, b) => {return a - b;});
}

let stage = new obj('stage', 0, canvas.height - 70, canvas.width, 100, 'rgba(255, 255, 255, 0.1)');

document.addEventListener('keydown', function (e) {
    let k = e.key;
    if (k == 'Enter') {
        processInput();
    }
});

function processInput() {
    let text = inp.value.split(' ');
    inp.value = '';
}

function getObjIndexFromId(id) {
    for (var i = 0; i < objs.length; i++) {
        if (objs[i].id * 1 == id * 1)
            return i;
    }
    return -1;
}

//GUI BACKEND

var selectedLightGroupBox = document.getElementsByClassName('selectedLightGroup');
var selectedColorBoxes = document.getElementsByClassName('selectedColor');

function togglePopup(popupName) {
    let popup = document.getElementById(popupName);
    if (popup.style.display == 'none')
        popup.style.display = 'inline';
    else
        popup.style.display = 'none';
}
var dockPos = 0;
var dockPositions = ['center', 'bottomLeft', 'bottomMiddle', 'bottomRight'];
function dockPopup(popupName) {
    let popup = document.getElementById(popupName);
    if (dockPos < dockPositions.length - 1)
        dockPos++;
    else
        dockPos = 0;
    if (dockPositions[dockPos] == 'bottomLeft') {
        popup.style.top = 'auto';
        popup.style.right = 'auto';
        popup.style.left = '260px';
        popup.style.bottom = '5px';
    }
    else if (dockPositions[dockPos] == 'bottomMiddle') {
        popup.style.top = 'auto';
        popup.style.right = 'auto';
        popup.style.left = '50%';
        popup.style.bottom = '5px';
    }
    else if (dockPositions[dockPos] == 'bottomRight') {
        popup.style.top = 'auto';
        popup.style.right = '5px';
        popup.style.left = 'auto';
        popup.style.bottom = '5px';
    }
    else if (dockPositions[dockPos] == 'center') {
        popup.style.top = '40%';
        popup.style.right = 'auto';
        popup.style.left = '50%';
        popup.style.bottom = 'auto';
    }
}

//Colors:
var selectedColor = 'white';
var colorButtons = document.getElementsByClassName('colorButton');
for (var i = 0; i < colorButtons.length; i++) {
    colorButtons[i].addEventListener("mousedown", event => {
        var id = event.target.id;
        selectedColor = id;
        document.getElementById('colorConsole').placeholder = 'Selected color: rgb(' + id + ')';
        for (var j = 0; j < selectedColorBoxes.length; j++) {
            selectedColorBoxes[j].placeholder = 'rgb(' + id + ')';
        }
    });
}

//Load Groups:
for (var i = 0; i < groups.length; i++) {
    let toWrite = "<button class='groupsButton' id='";
    for (var j = 0; j < groups[i][1].length; j++) {
        toWrite += groups[i][1][j] + ',';
    }
    toWrite += "' style='border-color: " + groups[i][2] + ";'>" + groups[i][0] + "</button>";
    document.getElementById('groupList').innerHTML += toWrite;
}
var selectedFixtures = [];
var selectedGroupName = "";
var groupButtons = document.getElementsByClassName('groupsButton');
for (var i = 0; i < groupButtons.length; i++) {
    groupButtons[i].addEventListener("mousedown", event => {
        var id = event.target.id.substring(0, event.target.id.length - 1);
        selectedFixtures = id.split(',');
        selectedGroupName = event.target.innerHTML;
        document.getElementById('groupsConsole').placeholder = 'Selected fixtures: ' + selectedFixtures;
        inp.placeholder = "Selected Group: " + selectedGroupName;
        for (var j = 0; j < selectedLightGroupBox.length; j++)
            selectedLightGroupBox[j].placeholder = selectedGroupName;
    });
}

//Effect Popup:
var brightness = 0;
function effectEnter() {
    let effectName = document.getElementById('effectName').value;
    let effectSpeed = document.getElementById('effectSpeed').value * 1;
    let effectDirection = document.getElementById('effectDirection').value;
    let effectPosition = 0;//document.getElementById('effectRow').value * 1;
    let effectStart = document.getElementById('effectColumn').value * 1;
    for (var i = 0; i < selectedFixtures.length; i++) {
        selectedFixtures[i] *= 1;
    }
    // [ lights[], effectName, effectSpeed, direction, position, start ]
    effects.push([selectedFixtures, effectName, effectSpeed, effectDirection, effectPosition, effectStart]);
    document.getElementById('effectConsole').placeholder = effectName + ' effect applied to ' + selectedGroupName;

    let toWrite = "<tr id='e" + (effects.length - 1) +  "'>";
    toWrite += "<td>" + selectedGroupName + "</td>";
    toWrite += "<td><input type='text' id='e" + (effects.length - 1) + "effectName' class='basicInput smallInput' placeholder='" + effectName + "'></td>";
    toWrite += "<td><input type='text' id='e" + (effects.length - 1) + "effectSpeed' class='basicInput smallInput' placeholder='" + effectSpeed + "'></td>";
    toWrite += "<td><input type='text' id='e" + (effects.length - 1) + "effectDirection' class='basicInput smallInput' placeholder='" + effectDirection + "'></td>";
    toWrite += "<td><input type='text' id='e" + (effects.length - 1) + "effectPosition' class='basicInput smallInput' placeholder='" + effectPosition + "'></td>";
    toWrite += "<td><input type='text' id='e" + (effects.length - 1) + "effectStart' class='basicInput smallInput' placeholder='" + effectStart + "'></td>";
    toWrite += "</tr>";
    document.getElementById('effectList').innerHTML += toWrite;
}
function applyEffects() {
    for (var i = 0; i < effects.length; i++) {
        let temp = [
            effects[i][0],
            document.getElementById('e' + i + 'effectName').value,
            document.getElementById('e' + i + 'effectSpeed').value * 1,
            document.getElementById('e' + i + 'effectDirection').value,
            document.getElementById('e' + i + 'effectPosition').value * 1,
            document.getElementById('e' + i + 'effectStart').value * 1,
        ]
        effects[i] = temp;
    }
}
function clearEffects() {
    for (var i = 0; i < effects.length; i++) {
        document.getElementById('e' + i).remove();
    }
    effects = [];
    document.getElementById('effectConsole').placeholder = "Cleared all effects";
    inp.placeholder = "Cleared all effects";
}

function fixtureEnter() {
    for (var i = 0; i < selectedFixtures.length; i++) {
        objs[selectedFixtures[i] * 1].color = 'rgba(' + selectedColor + ',' + (document.getElementById('fixtureBrightness').value * 1) / 100 + ')';
    }
    document.getElementById('fixtureConsole').placeholder = "Fixtures " + selectedFixtures + " set to " + selectedColor + " at " + document.getElementById('fixtureBrightness').value + "%";
}

//END OF GUI CODE

/*let g = false;
for (var i = 0; i < middleTree.fixtures.length; i++) {
    for (var j = 0; j < middleTree.fixtures[i].length; j++) {
        if (g) {
            middleTree.setFixture(i, j, colors.green, 100);
            leftTree.setFixture(i, j, colors.green, 100);
            rightTree.setFixture(i, j, colors.green, 100);
            g = false;
        }
        else {
            middleTree.setFixture(i, j, colors.red, 100);
            leftTree.setFixture(i, j, colors.red, 100);
            rightTree.setFixture(i, j, colors.red, 100);
            g = true;
        }
    }
}
leftTree.setEffect('sawtooth', 2, 'forward', 0, 0);
rightTree.setEffect('sawtooth', 2, 'reverse', 0, 4);*/

let b = 100; rising = false;
var clock = 0;
setInterval(function () {
    middleTree.update();
    leftTree.update();
    rightTree.update();

    runEffects();

    redraw();
    if (clock < 360)
        clock++;
    else
        clock = 0;
}, 1)