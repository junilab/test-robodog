
namespace Deflib {
    export enum posture {
        //% block="준비"
        ready,
        //% block="앉기"
        sitdown,
        //% block="물구나무서기"
        handstand,
        //% block="기지개켜기"
        stretch,
        //% block="인사하기"
        sayhello
    }

    export enum whatlegs {
        //% block="네다리"
        all_legs=0,
        //% block="앞다리"
        front_legs=1,
        //% block="뒷다리"
        back_legs=2,
        //% block="왼쪽다리"
        left_legs=3,
        //% block="오른쪽다리"
        right_legs=4
    }

    export enum legs {
        //% block="왼쪽위"
        left_front=0,
        //% block="왼쪽아래"
        left_back=1,
        //% block="오른쪽아래"
        right_back=2,
        //% block="오른쪽위"
        right_front=3,
        //% block="앞다리"
        front_legs=4,
        //% block="뒷다리"
        back_legs=5,
        //% block="왼쪽다리"
        left_legs=6,
        //% block="오른쪽다리"
        right_legs=7,
        //% block="네다리"
        all_legs=8
    }

    export enum rotate_dir {
        //% block="시계방향"
        cw=0,
        //% block="반시계방향"
        ccw=1 
    }

    export enum front_back {
        //% block="앞"
        front=0,
        //% block="뒤"
        back=1
    }

    export enum left_right {
        //% block="왼쪽"
        left=0,
        //% block="오른쪽"
        right=1
    }

    export enum lr_fb {
        //% block="좌우"
        lr=0,
        //% block="앞뒤"
        fb=1
    }

    export enum led_draw {
        //% block="초롱초롱"
        zero,
        //% block="ILOVEYOU"
        one,
        //% block="눈감기"
        two,
        //% block="감사"
        three,
        //% block="고마워요"
        four,
        //% block="뱁새"
        five,
        //% block="좌우굴리기"
        six,
        //% block="찢눈"
        seven,
        //% block="찢눈 깜박임"
        eight,
        //% block="곤충"
        nine,
        //% block="깜박"
        ten,
        //% block="뱀눈"
        eleven,
        //% block="바람개비"
        twelve,
        //% block="왕눈이"
        thirteen
    }

    export enum mp3_list {
        //% block="멍멍"
        _1 = 1,
        //% block="으르렁"
        _2 = 2,
        //% block="화난"
        _3 = 3,
        //% block="찡찡"
        _4 = 4,
        //% block="거친숨"
        _5 = 5,
        //% block="안녕"
        _11 = 11,
        //% block="기다려"
        _12 = 12,
        //% block="비켜"
        _13 = 13,
        //% block="출발"
        _14 = 14,
        //% block="레이저"
        _21 = 21,
        //% block="모터회전"
        _22 = 22,
        //% block="띠리리"
        _23 = 23,
        //% block="외계신호"
        _24 = 24,
        //% block="동작"
        _25 = 25,
        //% block="충돌"
        _26 = 26,
        //% block="도"
        _31 = 31,
        //% block="레"
        _32 = 32,
        //% block="미"
        _33 = 33,
        //% block="파"
        _34 = 34,
        //% block="솔"
        _35 = 35,
        //% block="라"
        _36 = 36,
        //% block="시"
        _37 = 37,
        //% block="#도"
        _38 = 38
    }

    export enum mp3_volume {
        //% block="크게"
        big = 3,
        //% block="중간으로"
        middle = 2,
        //% block="작게"
        small = 1
    }


    export function findPattern(buffer: Buffer, pattern: number[]): number {
        for (let j = 0; j <= buffer.length - pattern.length; j++) {
            let match = true;
            for (let k = 0; k < pattern.length; k++) {
                if (buffer[j + k] !== pattern[k]) {
                    match = false;
                    break;
                }
            }
            if (match) return j;
        }
        return -1;
    }

    export function toSigned8(n: number): number {
        n = n & 0xff
        return (n ^ 0x80) - 0x80
    }

    export function toSigned16(n: number): number {
        n = n & 0xffff
        return (n ^ 0x8000) - 0x8000
    }

    export function constrain(val: number, min: number, max: number): number {
        if (val > max)
            val = max
        if (val < min)
            val = min
        return val
    }
}
