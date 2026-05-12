package com.partnerappnew

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

// Activity that hosts the incoming-order ringing UI. Launched from a
// PendingIntent so Android allows it to be brought to the foreground even
// when the device is locked. The flags below match the WhatsApp incoming-call
// behavior: turn the screen on, show over the lock screen, dismiss keyguard
// when the user interacts.
class IncomingOrderActivity : ReactActivity() {

  override fun getMainComponentName(): String = "partnerappnew"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      val km = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
      km.requestDismissKeyguard(this, null)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
        android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      )
    }

    // Push the incoming order id into the launch intent extras so JS can
    // pick it up via Linking.getInitialURL or the standard intent extras path.
    intent?.let { handleIncomingIntent(it) }

    super.onCreate(savedInstanceState)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
      handleIncomingIntent(intent)
    }
  }

  private fun handleIncomingIntent(intent: Intent) {
    // Intent extras: orderId, orderJson — read on the JS side via a native
    // module bridge if needed. For now we just keep the intent so the JS
    // bootstrap can read AsyncStorage `pending_incoming_order` written by
    // the background message handler.
  }
}
