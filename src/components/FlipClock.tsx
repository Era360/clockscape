import React, { useEffect, useRef } from "react";

interface FlipClockProps {
  hours: string;
  minutes: string;
  seconds: string;
  showSeconds?: boolean;
  size?: "normal" | "large" | "fullscreen";
}

const FlipClock: React.FC<FlipClockProps> = ({
  hours,
  minutes,
  seconds,
  showSeconds = true,
  size = "fullscreen",
}) => {
  // Track previous values to detect changes
  const prevHoursRef = useRef(hours);
  const prevMinutesRef = useRef(minutes);
  const prevSecondsRef = useRef(seconds);

  useEffect(() => {
    // Check if each digit has changed and trigger flip if needed
    if (hours[0] !== prevHoursRef.current[0]) {
      flipDigit("hour-tens", prevHoursRef.current[0], hours[0]);
    }
    if (hours[1] !== prevHoursRef.current[1]) {
      flipDigit("hour-ones", prevHoursRef.current[1], hours[1]);
    }

    if (minutes[0] !== prevMinutesRef.current[0]) {
      flipDigit("minute-tens", prevMinutesRef.current[0], minutes[0]);
    }
    if (minutes[1] !== prevMinutesRef.current[1]) {
      flipDigit("minute-ones", prevMinutesRef.current[1], minutes[1]);
    }

    if (showSeconds) {
      if (seconds[0] !== prevSecondsRef.current[0]) {
        flipDigit("second-tens", prevSecondsRef.current[0], seconds[0]);
      }
      if (seconds[1] !== prevSecondsRef.current[1]) {
        flipDigit("second-ones", prevSecondsRef.current[1], seconds[1]);
      }
    }

    // Update refs with current values
    prevHoursRef.current = hours;
    prevMinutesRef.current = minutes;
    prevSecondsRef.current = seconds;
  }, [hours, minutes, seconds, showSeconds]);

  const flipDigit = (id: string, oldValue: string, newValue: string) => {
    // Find the container element
    const container = document.getElementById(id);
    if (!container) return;

    // Skip animation if there's already one in progress
    if (container.querySelector(".flip-top")) {
      return;
    }

    // Get the static elements
    const staticTop = container.querySelector(".digit-top");
    const staticBottom = container.querySelector(".digit-bottom");
    if (!staticTop || !staticBottom) return;

    // Create the flipping elements
    const flipTop = document.createElement("div");
    flipTop.className = "flip-top";
    flipTop.innerHTML = `<span>${oldValue}</span>`;

    const flipBottom = document.createElement("div");
    flipBottom.className = "flip-bottom";
    flipBottom.innerHTML = `<span>${newValue}</span>`;

    // Update the static elements for when animation is done
    if (staticTop instanceof HTMLElement) {
      staticTop.innerHTML = `<span>${newValue}</span>`;
    }
    if (staticBottom instanceof HTMLElement) {
      staticBottom.innerHTML = `<span>${newValue}</span>`;
    }

    // Add the flipping elements to the container
    container.appendChild(flipTop);
    container.appendChild(flipBottom);

    // Remove the flipping elements when the animations are complete
    setTimeout(() => {
      if (flipTop && flipTop.parentNode === container) {
        container.removeChild(flipTop);
      }
    }, 300);

    setTimeout(() => {
      if (flipBottom && flipBottom.parentNode === container) {
        container.removeChild(flipBottom);
      }
    }, 600);
  };

  return (
    <div className="clock-container">
      {/* Main time section - hours and minutes */}
      <div className={`flip-clock main-time ${size}`}>
        {/* Hours */}
        <div className="group hours">
          <div className="flip-unit-container" id="hour-tens">
            <div className="digit-top">
              <span>{hours[0]}</span>
            </div>
            <div className="digit-bottom">
              <span>{hours[0]}</span>
            </div>
          </div>
          <div className="flip-unit-container" id="hour-ones">
            <div className="digit-top">
              <span>{hours[1]}</span>
            </div>
            <div className="digit-bottom">
              <span>{hours[1]}</span>
            </div>
          </div>
        </div>

        {/* Minutes */}
        <div className="group minutes">
          <div className="flip-unit-container" id="minute-tens">
            <div className="digit-top">
              <span>{minutes[0]}</span>
            </div>
            <div className="digit-bottom">
              <span>{minutes[0]}</span>
            </div>
          </div>
          <div className="flip-unit-container" id="minute-ones">
            <div className="digit-top">
              <span>{minutes[1]}</span>
            </div>
            <div className="digit-bottom">
              <span>{minutes[1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seconds - separate section below */}
      {showSeconds && (
        <div className="seconds-container">
          <div className="group seconds">
            <div className="flip-unit-container" id="second-tens">
              <div className="digit-top">
                <span>{seconds[0]}</span>
              </div>
              <div className="digit-bottom">
                <span>{seconds[0]}</span>
              </div>
            </div>
            <div className="flip-unit-container" id="second-ones">
              <div className="digit-top">
                <span>{seconds[1]}</span>
              </div>
              <div className="digit-bottom">
                <span>{seconds[1]}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date would go here if needed */}
    </div>
  );
};

export default FlipClock;
