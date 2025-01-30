/**
* Control RoboDog 
*/
let legPos: number[][] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [1, 0, 0, 1], [0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 1, 1], [1, 1, 1, 1]];
//% groups='["동작", "LED", "소리", "확장", "센서"]'
//% block="로보독" weight=80 color=#4f8c61 icon="\uf188"
namespace robodog {
    let isInit = 0;
    let battery = 0;
    let tof = 0;
    let yaw = 0;
    let roll = 0;
    let pitch = 0;
    let button = 0;
    let timerCnt = 0;
    let txData = pins.createBuffer(48);
    let rxData = pins.createBuffer(0);
    let ledData = pins.createBuffer(34);
    let delimiter = [0x40, 0x21, 0x23, 0x25];
    export let counter = 0;

    function checksum(buf: Buffer): number {
        let sum = 0;
        if (buf[4] > buf.length)
            return -1;
        for (let i = 6; i < buf[4]; i++) {
            sum += buf[i];
        }
        return sum & 0xFF;
    }


    loops.everyInterval(10, function () {
        if (isInit == 0) {
            serial.setRxBufferSize(40)
            serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BaudRate115200);
            txData[0] = 0x26; txData[1] = 0xA8; txData[2] = 0x14; txData[3] = 0x81; txData[4] = 48;
            isInit = 1;
        }

        if ((txData[14] & 0xC0) == 0xC0) {
            if ((timerCnt % 2) == 0) {
                txData[14] = ledData[0];
                for (let p = 0; p < 16; p++)
                    txData[24 + p] = ledData[2 + p];
            }
            else {
                txData[14] = ledData[1];
                for (let p = 0; p < 16; p++)
                    txData[24 + p] = ledData[18 + p];
            }
        }

        txData[5] = checksum(txData);
        serial.writeBuffer(txData);
        timerCnt += 1;
    });

    serial.onDataReceived("%", function () {
        rxData = rxData.concat(serial.readBuffer(0));
        let index = Deflib.findPattern(rxData, delimiter);
        if (index >= 0) {
            let packet = rxData.slice(0, index);
            rxData = rxData.slice(index + delimiter.length);
            if (packet.length > 19 && checksum(packet) == packet[5]) {
                battery = packet[6]
                tof = packet[7]
                roll = Deflib.toSigned8(packet[8])
                pitch = Deflib.toSigned8(packet[9])
                yaw = Deflib.toSigned16((packet[11] << 8) | packet[10])
                button = packet[16]
                //txData[14] = 3;
                //txData[24] = tof % 10 + 0x30;
                //txData[32] = tof / 10 + 0x30;
            }
        }
    });


    function check_modeChange(initValue: number, mode: number): void {
        if (txData[15] != mode) {
            for (let i = 16; i < 24; i++)
                txData[i] = initValue;
            txData[15] = mode;
        }
    }


    //% block="$action 자세 취하기"
    //% group="동작"
    //% weight=100
    export function gesture(action: Deflib.posture): void {
        check_modeChange(0, 4);
        txData[16] = Deflib.constrain(action, 0, 4)
    }


    //% block="$legs (을)를 $height 보행높이로 설정하기"
    //% leg.defl=Deflib.whatlegs.all_legs height.defl=60
    //% group="동작"
    //% weight=99
    export function leg_bend(legs: Deflib.whatlegs, height: number): void {
        check_modeChange(0, 1);
        height = Deflib.constrain(height, 20, 90);
        if (legs == 0)
            txData[16] = txData[17] = txData[18] = txData[19] = height;
        if (legs == 1)
            txData[16] = txData[19] = height;
        if (legs == 2)
            txData[17] = txData[18] = height;
        if (legs == 3)
            txData[16] = txData[17] = height;
        if (legs == 4)
            txData[18] = txData[19] = height;
    }


    //% block="$dir (으)로 $velocity 빠르기로 이동하기"
    //% velocity.defl=50
    //% group="동작"
    //% weight=98
    export function move(dir: Deflib.front_back, velocity: number): void {
        check_modeChange(0, 1);
        velocity = Deflib.constrain(velocity, -100, 100);
        txData[20] = (dir == Deflib.front_back.front) ? velocity : -1 * velocity;
    }


    //% block="$leg 다리높이 $height, 발끝앞뒤 $fb로 설정하기"
    //% height.defl=60
    //% group="동작"
    //% weight=97
    export function leg(leg: Deflib.legs, height: number, fb: number): void {
        check_modeChange(-127, 2);
        height = Deflib.constrain(height, 20, 90);
        fb = Deflib.constrain(fb, -90, 90);

        let _pos = legPos[leg];
        for (let n = 0; n < 4; n++) {
            if (_pos[n] == 1) {
                txData[16 + n * 2] = height;
                txData[16 + n * 2 + 1] = fb;
            }
        }
    }


    //% block="$leg 어깨 $deg1도, 무릎 $deg2도 설정하기"
    //% group="동작"
    //% weight=96
    export function motor(leg: Deflib.legs, deg1: number, deg2: number): void {
        check_modeChange(-127, 3);

        deg1 = Deflib.constrain(deg1, -90, 90);
        deg2 = Deflib.constrain(deg2, -90, 90);

        let _pos = legPos[leg];
        for (let n = 0; n < 4; n++) {
            if (_pos[n] == 1) {
                txData[16 + n * 2] = deg1;
                txData[16 + n * 2 + 1] = deg2;
            }
        }
    }


    //% block="$dir (으)로 $deg 도를 $velocity각속도로 회전하기"
    //% deg.defl=90 velocity.defl=100
    //% group="동작"
    //% weight=95
    export function rotation(dir: Deflib.rotate_dir, deg: number, velocity: number): void {
        check_modeChange(0, 1);
        deg = Deflib.constrain(deg, -1000, 1000);

        deg = (dir == Deflib.rotate_dir.cw) ? deg : -1 * deg;
        txData[22] = deg & 0xFF;
        txData[23] = (deg >> 8) & 0xFF;
        txData[21] = Deflib.constrain(velocity, 10, 100);
    }


    //% block="$leg 회전속도를 어깨 $vel1, 무릎 $vel2 (으)로 설정하기"
    //% leg.defl=Deflib.legs.all_legs vel1.defl=50 vel2.defl=50
    //% group="동작"
    //% weight=95
    export function motor_velocity(leg: Deflib.legs, vel1: number, vel2: number): void {
        vel1 = Deflib.constrain(vel1, 10, 100);
        vel2 = Deflib.constrain(vel2, 10, 100);

        let _pos = legPos[leg];

        for (let n = 0; n < 4; n++) {
            if (_pos[n] == 1) {
                txData[40 + n * 2] = vel1;
                txData[40 + n * 2 + 1] = vel2;
            }
        }
    }


    //% block="$exp 표정을 헤드 LED에 표현하기"
    //% group="LED"
    //% weight=89
    export function headled_exp(exp: Deflib.led_draw): void {
        txData[14] = (txData[14] & 0xC0) | 0x82;
        txData[24] = exp;
        ledData[0] = txData[14];
        ledData[1] = ledData[1] | 0x80;
        for (let n = 0; n < 16; n++)
            ledData[n + 2] = txData[n + 24];
    }

    //% block="$what 헤드 LED에 $data 표현하기"
    //% group="LED"
    //% weight=88
    export function headled_draw(what: Deflib.left_right, data:number[]): void {
        if (!Array.isArray(data) || data.length != 8)
            return
        
        txData[14] = (txData[14] & 0xC0) | 0x81;
        for (let n = 0; n < 8; n++)
            txData[24 + what*8 + n] = data[n];
        ledData[0] = txData[14];
        ledData[1] = ledData[1] | 0x80;
        for (let n = 0; n < 16; n++)
            ledData[n + 2] = txData[n + 24];
    }


    //% block="$what 헤드LED에 $character 문자 출력하기"
    //%character.defl="A"
    //% group="LED"
    //weight=87
    export function headled_print(what: Deflib.left_right, character: string): void {
        txData[14] = (txData[14] & 0xC0) | 0x83;
        let aa = character.charCodeAt(0);
		txData[24 + what*8] = aa;
        ledData[0] = txData[14];
        ledData[1] = ledData[1] | 0x80;
        for (let n = 0; n < 16; n++)
            ledData[n + 2] = txData[n + 24];
    }


    //% block="R:$r, G:$g, B:$b로 바디LED 색상 출력하기"
    //%r.defl=255 g.defl=255 b.defl=255
    //% group="LED"
    //% weight=86
    export function bodyled(r: number, g: number, b: number): void {
        txData[24] = Deflib.constrain(r, 0, 255);
        txData[25] = Deflib.constrain(g, 0, 255);
        txData[26] = Deflib.constrain(b, 0, 255);

        txData[28] = txData[32] = txData[36] = txData[24];
        txData[29] = txData[33] = txData[37] = txData[25];
        txData[30] = txData[34] = txData[38] = txData[26];
        txData[14] = (txData[14] & 0xC0) | 0x44;
        ledData[1] = txData[14];
        ledData[0] = ledData[0] | 0x40;
        for (let n = 0; n < 16; n++)
            ledData[n + 18] = txData[n + 24];
    }


    //% block="$what 소리를 $volume 출력하기"
    //% group="소리"
    //% weight=79
    export function sound_play(what: Deflib.mp3_list, volume: Deflib.mp3_volume): void {
        let id = (txData[7] & 0x80) == 0x80 ? 0x00 : 0x80;
        txData[7] = what | id;
        txData[8] = volume;
    }


    //% block="확장 서보모터 $deg 도 설정하기"
    //% deg.defl=45
    //% group="확장"
    //% weight=69
    export function ext_servo(deg: number): void {
        txData[12] = Deflib.constrain(deg, -90, 90);
    }


    //% block="버튼"
    //% group="센서"
    //% weight=59
    export function get_button(): number {
        return button;
    }


    //% block="배터리"
    //% group="센서"
    //% weight=58
    export function get_battery(): number {
        return battery;
    }


    //% block="거리센서"
    //% group="센서"
    //% weight=57
    export function get_tof(): number {
        return tof;
    }


    //% block="$what 기울기"
    //% group="센서"
    //% weight=56
    export function get_tilt(what: Deflib.lr_fb): number {
        return what == Deflib.lr_fb.lr ? roll : pitch;
    }


    //% block="회전"
    //% group="센서"
    //% weight=55
    export function get_rotation(): number {
        return yaw;
    }
}
