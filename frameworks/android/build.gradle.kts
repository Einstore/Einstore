plugins {
  id("com.android.library") version "8.1.0"
  id("org.jetbrains.kotlin.android") version "1.9.22"
}

android {
  namespace = "com.einstore.tracking"
  compileSdk = 34

  defaultConfig {
    minSdk = 21
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }

  kotlinOptions {
    jvmTarget = "11"
  }
}

dependencies {
  testImplementation("junit:junit:4.13.2")
}
