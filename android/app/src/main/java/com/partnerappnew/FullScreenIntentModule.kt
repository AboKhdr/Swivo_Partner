package com.partnerappnew

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FullScreenIntentModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "FullScreenIntent"

  // Launches IncomingOrderActivity over the lock screen. Called from the
  // setBackgroundMessageHandler so the WhatsApp-style call screen appears
  // even when the device is locked / the app is in the background.
  @ReactMethod
  fun launchIncomingOrder(orderId: String, orderJson: String, promise: Promise) {
    try {
      val ctx = reactApplicationContext
      val intent = Intent(ctx, IncomingOrderActivity::class.java).apply {
        addFlags(
          Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP
        )
        putExtra("orderId", orderId)
        putExtra("orderJson", orderJson)
      }
      ctx.startActivity(intent)
      promise.resolve(true)
    } catch (e: Throwable) {
      promise.reject("E_LAUNCH_INCOMING", e.message ?: "unknown", e)
    }
  }

  @ReactMethod
  fun canUseFullScreen(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        promise.resolve(true)
        return
      }
      val nm = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE)
        as NotificationManager
      promise.resolve(nm.canUseFullScreenIntent())
    } catch (e: Throwable) {
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun openFullScreenSettings(promise: Promise) {
    try {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
          data = Uri.parse("package:" + reactApplicationContext.packageName)
        }
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:" + reactApplicationContext.packageName)
        }
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Throwable) {
      promise.reject("E_OPEN_SETTINGS", e.message ?: "unknown", e)
    }
  }

  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:" + reactApplicationContext.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Throwable) {
      promise.reject("E_OPEN_BATTERY", e.message ?: "unknown", e)
    }
  }
}
