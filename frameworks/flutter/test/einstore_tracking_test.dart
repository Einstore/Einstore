import 'package:einstore_tracking/einstore_tracking.dart';
import 'package:test/test.dart';

void main() {
  test('default services include analytics and usage', () {
    final config = EinstoreTrackingConfig();
    expect(config.services, contains(EinstoreService.analytics));
    expect(config.services, contains(EinstoreService.usage));
  });

  test('memory launch store tracks launches', () async {
    final store = MemoryLaunchStore();
    const key = 'einstore.launch.test';

    expect(await store.hasLaunched(key), isFalse);
    await store.markLaunched(key);
    expect(await store.hasLaunched(key), isTrue);
  });
}
