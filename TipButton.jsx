import { useRef } from 'react'
import { gsap } from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'

// Register GSAP plugin
gsap.registerPlugin(Physics2DPlugin)

const TipButton = ({ onTip, disabled = false }) => {
  const buttonRef = useRef(null)
  const coinRef = useRef(null)

  const config = {
    theme: 'light',
    muted: true,
    timeScale: 1.1,
    distance: { lower: 100, upper: 350 },
    bounce: { lower: 2, upper: 12 },
    velocity: { lower: 300, upper: 700 },
    rotation: { lower: 0, upper: 15 },
    flipSpeed: { lower: 0.25, upper: 0.6 },
    spins: { lower: 1, upper: 6 },
    rotate: { lower: 0, upper: 90 },
  }

  const tipSound = new Audio('https://myinstants.com/media/sounds/coin_1.mp3')
  tipSound.volume = 0.3
  tipSound.muted = config.muted

  const handleTip = () => {
    const button = buttonRef.current
    const coin = coinRef.current
    
    if (!button || !coin || button.dataset.tipping === 'true' || disabled) return

    const currentRotation = gsap.getProperty(button, 'rotate')
    if (currentRotation < 0) document.documentElement.dataset.flipped = 'true'
    
    button.dataset.tipping = 'true'

    const duration = gsap.utils.mapRange(
      config.rotation.lower,
      config.rotation.upper,
      0,
      config.flipSpeed.upper
    )(Math.abs(currentRotation))

    const distance = gsap.utils.snap(1, gsap.utils.mapRange(
      config.rotation.lower,
      config.rotation.upper,
      config.distance.lower,
      config.distance.upper
    )(Math.abs(currentRotation)))

    const velocity = gsap.utils.mapRange(
      config.rotation.lower,
      config.rotation.upper,
      config.velocity.lower,
      config.velocity.upper
    )(Math.abs(currentRotation))

    const bounce = gsap.utils.mapRange(
      config.velocity.lower,
      config.velocity.upper,
      config.bounce.lower,
      config.bounce.upper
    )(Math.abs(velocity))

    const distanceDuration = gsap.utils.mapRange(
      config.distance.lower,
      config.distance.upper,
      config.flipSpeed.lower,
      config.flipSpeed.upper
    )(distance)

    const spin = gsap.utils.snap(1, gsap.utils.mapRange(
      config.distance.lower,
      config.distance.upper,
      config.spins.lower,
      config.spins.upper
    )(distance))

    const offRotate = gsap.utils.random(config.rotate.lower, config.rotate.upper, 1) * -1
    const hangtime = Math.max(1, duration * 4)

    const tl = gsap.timeline({
      onComplete: () => {
        if (!config.muted) {
          tipSound.muted = false
          tipSound.play()
        }
        
        gsap.set(coin, { yPercent: 100 })
        
        gsap.timeline({
          onComplete: () => {
            gsap.set(button, { clearProps: 'all' })
            gsap.set(coin, { clearProps: 'all' })
            gsap.set(button.querySelector('.purse'), { clearProps: 'all' })
            button.dataset.tipping = 'false'
            
            // Call the onTip callback
            onTip?.()
          },
        })
        .to(button, {
          yPercent: bounce,
          repeat: 1,
          duration: 0.12,
          yoyo: true,
        })
        .fromTo(button.querySelector('.hole'), {
          scale: 1,
        }, {
          scale: 0,
          duration: 0.2,
          delay: 0.2,
        })
        .set(coin, { clearProps: 'all' })
        .set(coin, { yPercent: -50 })
        .fromTo(button.querySelector('.purse'), {
          xPercent: -200,
        }, {
          delay: 0.5,
          xPercent: 0,
          duration: 0.5,
          ease: 'power1.out',
        })
        .fromTo(coin, {
          rotate: -460,
        }, {
          rotate: 0,
          duration: 0.5,
          ease: 'power1.out',
        }, '<')
        .timeScale(config.timeScale)
      },
    })
    .set(button, { transition: 'none' })
    .fromTo(button, {
      rotate: currentRotation,
    }, {
      rotate: 0,
      duration,
      ease: 'elastic.out(1.75,0.75)',
    })
    .to(coin, {
      onUpdate: function () {
        const y = gsap.getProperty(coin, 'y')
        if (y >= coin.offsetHeight) {
          this.progress(1)
          tl.progress(1)
        }
      },
      duration: hangtime,
      physics2D: {
        velocity,
        angle: -90,
        gravity: 1000,
      },
    }, `>-${duration * 0.825}`)
    .fromTo(coin, {
      rotateX: 0,
    }, {
      duration: distanceDuration * 2,
      rotateX: spin * -360,
    }, '<')
    .to(coin, {
      rotateY: offRotate,
      duration: distanceDuration,
    }, '<')
    .to(coin, {
      '--rx': offRotate,
      duration: distanceDuration,
    }, '<')
    .fromTo(button.querySelector('.hole'), {
      scale: 0,
    }, {
      scale: 1,
      duration: 0.2,
    }, hangtime * 0.35)
    .timeScale(config.timeScale)
  }

  return (
    <button 
      ref={buttonRef}
      className="tip-button"
      aria-label="Leave a tip" 
      data-tipping="false"
      onClick={handleTip}
      disabled={disabled}
    >
      <span className="content">
        <span className="scene">
          <span className="hole"></span>
          <div className="purse">
            <div className="coin" ref={coinRef}>
              <div className="coin__face coin__face--front">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 273.6 360">
                  <title>Bitcoin</title>
                  <path
                    d="M217.02 167.04c18.63-9.48 30.29-26.18 27.57-54-3.67-38.03-36.53-50.78-78.01-54.4V5.88h-32.15v51.35c-8.46 0-17.08.17-25.66.34l-.01-51.68H76.65v52.72c-6.96.14-13.8.28-20.47.28v-.16l-44.33-.01V93s23.74-.45 23.35-.02c13.01.01 17.26 7.56 18.48 14.08l.01 60.08v84.4c-.57 4.09-2.98 10.63-12.08 10.64.41.36-23.38 0-23.38 0l-6.38 38.33h41.82c7.8 0 15.45.13 22.96.19l.03 53.34h32.1v-52.77c8.82.18 17.35.25 25.68.24l-.01 52.54h32.13l.02-53.25c54.02-3.1 91.84-16.7 96.55-67.39 3.79-40.8-15.44-59.02-46.1-66.38zM109.53 95.32c18.13 0 75.14-5.77 75.14 32.07 0 36.26-57 32.03-75.13 32.03v-64.1zm0 167.13v-70.67c21.78-.01 90.09-6.27 90.1 35.32 0 39.87-68.32 35.33-90.1 35.35z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="coin__core"></div>
              <div className="coin__core coin__core--rotated"></div>
              <div className="coin__face coin__face--rear">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 273.6 360">
                  <title>Bitcoin</title>
                  <path
                    d="M217.02 167.04c18.63-9.48 30.29-26.18 27.57-54-3.67-38.03-36.53-50.78-78.01-54.4V5.88h-32.15v51.35c-8.46 0-17.08.17-25.66.34l-.01-51.68H76.65v52.72c-6.96.14-13.8.28-20.47.28v-.16l-44.33-.01V93s23.74-.45 23.35-.02c13.01.01 17.26 7.56 18.48 14.08l.01 60.08v84.4c-.57 4.09-2.98 10.63-12.08 10.64.41.36-23.38 0-23.38 0l-6.38 38.33h41.82c7.8 0 15.45.13 22.96.19l.03 53.34h32.1v-52.77c8.82.18 17.35.25 25.68.24l-.01 52.54h32.13l.02-53.25c54.02-3.1 91.84-16.7 96.55-67.39 3.79-40.8-15.44-59.02-46.1-66.38zM109.53 95.32c18.13 0 75.14-5.77 75.14 32.07 0 36.26-57 32.03-75.13 32.03v-64.1zm0 167.13v-70.67c21.78-.01 90.09-6.27 90.1 35.32 0 39.87-68.32 35.33-90.1 35.35z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
        </span>
        <span>Buy BTC</span>
      </span>
    </button>
  )
}

export default TipButton