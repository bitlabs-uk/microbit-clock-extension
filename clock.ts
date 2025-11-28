//% color="#57a6ff" weight=100 group="Display" "Time" "Date" "Date and Time Configuration"
namespace clock {
  let on: boolean = false;
  let dotsOn: boolean = false;
  let digit2: number; /* required for turnig dots on/off */

  let CLK = DigitalPin.P8;
  let DIO = DigitalPin.P16;

  let WRITE_CMD = 0x40;
  const DIG = [
    0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f, 0x77, 0x7c,
    0x39, 0x5e, 0x79, 0x71,
  ];

  /* Clock variables */
  let useRtc: boolean = false;
  let time = {
    seconds: 0,
    minutes: 0,
    hour: 0,
  };
  let date = {
    day: 1,
    month: 1,
    year: 2025,
  };

  loops.everyInterval(1000, function () {
    if (!useRtc) {
      time.seconds = time.seconds + 1;
      if (time.seconds >= 60) {
        time.seconds = 0;
        time.minutes = time.minutes + 1;
      }
      if (time.minutes >= 60) {
        time.minutes = 0;
        time.hour = time.hour + 1;
      }
      if (time.hour >= 24) {
        time.hour = 0;
        date.day = date.day + 1;
      }
    }
  });

  //% block group="Display"
  //% weight=10
  export function ShowNumbers(num1: number, num2: number): void {
    _start();
    _sendByte(WRITE_CMD);
    _stop();

    _start();
    _sendByte(0xc0); /* First digit address */
    /* 4 segments */
    _sendByte(DIG[Math.idiv(num1, 10) % 10]);
    digit2 = DIG[num1 % 10];
    _sendByte(digit2 | (dotsOn ? 0x80 : 0));
    _sendByte(DIG[Math.idiv(num2, 10) % 10]);
    _sendByte(DIG[num2 % 10]);
    _stop();

    if (!on) {
      _start();
      _sendByte(0x80 | 8 /*ON*/ | 3 /*Brightness*/);
      _stop();
      on = true;
    }
  }

  //% block group="Display"
  //% weight=9
  export function showNumber(num: number): void {
    _start();
    _sendByte(WRITE_CMD);
    _stop();

    _start();
    _sendByte(0xc0); /* First digit address */
    /* 4 segments */
    _sendByte(DIG[Math.idiv(num, 1000) % 10]);
    digit2 = DIG[Math.idiv(num, 100) % 10];
    _sendByte(digit2 | (dotsOn ? 0x80 : 0));
    _sendByte(DIG[Math.idiv(num, 10) % 10]);
    _sendByte(DIG[num % 10]);
    _stop();

    if (!on) {
      _start();
      _sendByte(0x80 | 8 | 3);
      _stop();
      on = true;
    }
  }

  //% block group="Display"
  //% weight=8
  export function showDots(): void {
    dotsOn = true;
    _start();
    _sendByte(WRITE_CMD);
    _stop();

    _start();
    _sendByte(0xc1); /* Second digit address */
    _sendByte(digit2 | 0x80);
    _stop();

    if (!on) {
      _start();
      _sendByte(0x80 | 8 | 3);
      _stop();
      on = true;
    }
  }

  //% block group="Display"
  //% weight=7
  export function hideDots(): void {
    dotsOn = false;
    _start();
    _sendByte(WRITE_CMD);
    _stop();

    _start();
    _sendByte(0xc1); /* Second digit address */
    _sendByte(digit2);
    _stop();

    if (!on) {
      _start();
      _sendByte(0x80 | 8 | 3);
      _stop();
      on = true;
    }
  }

  /* --- Time --- */

  //% block group="Time"
  export function setSeconds(seconds: number): void {
    if (useRtc) {
      const seconds1 = seconds % 10;
      const seconds10 = Math.floor(seconds / 10);

      const s = (seconds10 << 4) | seconds1;
      const buf = pins.createBufferFromArray([0, s]);
      pins.i2cWriteBuffer(104, buf, false);
    } else {
      time.seconds = seconds;
    }
  }
  //% block group="Time"
  export function setMinutes(minutes: number): void {
    if (useRtc) {
      const minutes1 = minutes % 10;
      const minutes10 = Math.floor(minutes / 10);

      const m = (minutes10 << 4) | minutes1;
      const buf = pins.createBufferFromArray([1, m]);
      pins.i2cWriteBuffer(104, buf, false);
    } else {
      time.minutes = minutes;
    }
  }
  //% block group="Time"
  export function setHours(hours: number): void {
    if (useRtc) {
      const hours1 = hours % 10;
      const hours10 = hours >= 10 && hours < 20 ? 1 : 0;
      const hours20 = hours >= 20 ? 1 : 0;

      const h = 0x40 | (hours20 << 5) | (hours10 << 4) | hours1;
      const buf = pins.createBufferFromArray([2, h]);
      pins.i2cWriteBuffer(104, buf, false);
    } else {
      time.hour = hours;
    }
  }

  //% block group="Date"
  //% year.defl=2025
  export function setYear(year: number): void {
    if (useRtc) {
      year = year - 2000;

      const year1 = year % 10;
      const year10 = Math.floor(year / 10);

      const y = (year10 << 4) | year1;
      const buf = pins.createBufferFromArray([6, y]);
      pins.i2cWriteBuffer(104, buf, false);
    } else {
      date.year = year;
    }
  }
  //% block group="Date"
  //% month.defl=1
  export function setMonth(month: number): void {
    if (useRtc) {
      const month1 = month % 10;
      const month10 = Math.floor(month / 10);

      const m = (month10 << 4) | month1;
      const buf = pins.createBufferFromArray([5, m]);
      pins.i2cWriteBuffer(104, buf, false);
    } else {
      date.month = month;
    }
  }
  //% block group="Date"
  //% day.defl=1
  export function setDay(day: number): void {
    if (useRtc) {
      const day1 = day % 10;
      const day10 = Math.floor(day / 10);

      const d = (day10 << 4) | day1;
      const buf = pins.createBufferFromArray([4, d]);
      pins.i2cWriteBuffer(104, buf, false);
    } else {
      date.day = day;
    }
  }

  //% block group="Time"
  export function seconds(): number {
    if (useRtc) {
      pins.i2cWriteNumber(104, 0, NumberFormat.UInt8LE, true);
      const buf = pins.i2cReadBuffer(104, 0x1, false);
      const sec10 = (buf[0] & 0x70) >> 4;
      const sec1 = buf[0] & 0x0f;
      return sec10 * 10 + sec1;
    } else {
      return time.seconds;
    }
  }

  //% block group="Time"
  export function minutes(): number {
    if (useRtc) {
      pins.i2cWriteNumber(104, 1, NumberFormat.UInt8LE, true);
      const buf = pins.i2cReadBuffer(104, 0x1, false);
      const min10 = (buf[0] & 0x70) >> 4;
      const min1 = buf[0] & 0x0f;
      return min10 * 10 + min1;
    } else {
      return time.minutes;
    }
  }

  //% block group="Time"
  export function hours(): number {
    if (useRtc) {
      pins.i2cWriteNumber(104, 2, NumberFormat.UInt8LE, true);
      const buf = pins.i2cReadBuffer(104, 0x1, false);
      const h10 = (buf[0] & 0x10) >> 4;
      const h20 = (buf[0] & 0x20) >> 5;
      const h1 = buf[0] & 0x0f;
      return h20 * 20 + h10 * 10 + h1;
    } else {
      return time.hour;
    }
  }

  //% block group="Date"
  export function day(): number {
    if (useRtc) {
      pins.i2cWriteNumber(104, 4, NumberFormat.UInt8LE, true);
      const buf = pins.i2cReadBuffer(104, 0x1, false);
      const day10 = (buf[0] & 0x70) >> 4;
      const day1 = buf[0] & 0x0f;
      return day10 * 10 + day1;
    } else {
      return date.day;
    }
  }

  //% block group="Date"
  export function month(): number {
    if (useRtc) {
      pins.i2cWriteNumber(104, 5, NumberFormat.UInt8LE, true);
      const buf = pins.i2cReadBuffer(104, 0x1, false);
      const mon10 = (buf[0] & 0b0010000) >> 4;
      const mon1 = buf[0] & 0b00001111;
      return mon10 * 10 + mon1;
    } else {
      return date.month;
    }
  }

  //% block group="Date"
  export function year(): number {
    if (useRtc) {
      pins.i2cWriteNumber(104, 6, NumberFormat.UInt8LE, true);
      const buf = pins.i2cReadBuffer(104, 0x1, false);
      const year10 = (buf[0] & 0b11110000) >> 4;
      const year1 = buf[0] & 0b00001111;
      return year10 * 10 + year1 + 2000;
    } else {
      return date.year;
    }
  }

  // --- Display ---
  function _sendByte(b: number) {
    for (let i = 0; i < 8; i++) {
      pins.digitalWritePin(DIO, (b >> i) & 0x01);
      control.waitMicros(100);
      pins.digitalWritePin(CLK, 1);
      control.waitMicros(100);
      pins.digitalWritePin(CLK, 0);
      control.waitMicros(100);
    }

    /* ACK */
    pins.digitalWritePin(CLK, 1);
    control.waitMicros(100);
    pins.digitalWritePin(CLK, 0);
    control.waitMicros(100);
  }

  function _start() {
    pins.digitalWritePin(CLK, 0);
    control.waitMicros(100);
    /* Set IO lines */
    pins.digitalWritePin(DIO, 1);
    control.waitMicros(100);
    pins.digitalWritePin(CLK, 1);
    control.waitMicros(100);
    /* Start */
    pins.digitalWritePin(DIO, 0); /* clk is already high */
    control.waitMicros(100);
    pins.digitalWritePin(CLK, 0);
    control.waitMicros(100);
  }

  function _stop() {
    pins.digitalWritePin(CLK, 0);
    control.waitMicros(100);
    pins.digitalWritePin(DIO, 0);
    control.waitMicros(100);
    pins.digitalWritePin(CLK, 1);
    control.waitMicros(100);
    pins.digitalWritePin(DIO, 1);
    control.waitMicros(100);
  }

  //% block="use external DS3231 for Time and Date" group="Extensions"
  export function useExternalDS3231(): void {
    useRtc = true;
  }
}
