package com.einstore.tracking

import org.junit.Assert.assertTrue
import org.junit.Test

class EinstoreTrackingConfigTest {
  @Test
  fun defaultsEnableAllServices() {
    val config = EinstoreTrackingConfig()
    val services = config.services

    assertTrue(services.contains(EinstoreService.ANALYTICS))
    assertTrue(services.contains(EinstoreService.ERRORS))
    assertTrue(services.contains(EinstoreService.DISTRIBUTION))
    assertTrue(services.contains(EinstoreService.DEVICES))
    assertTrue(services.contains(EinstoreService.USAGE))
  }
}
