rm -rf .build
vapor clean -y --verbose
rm Package.resolved
vapor xcode --verbose
