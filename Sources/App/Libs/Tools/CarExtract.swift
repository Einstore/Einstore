//
//  CarExtract.swift
//  Boost
//
//  Created by Ondrej Rafaj on 13/12/2016.
//
//

import Foundation


enum ThemeIdiom {
    case kCoreThemeIdiomUniversal
    case kCoreThemeIdiomPhone
    case kCoreThemeIdiomPad
    case kCoreThemeIdiomTV
    case kCoreThemeIdiomCar
    case kCoreThemeIdiomWatch
    case kCoreThemeIdiomMarketing
}

enum UserInterfaceSizeClass: Int {
    case UIUserInterfaceSizeClassUnspecified = 0
    case UIUserInterfaceSizeClassCompact = 1
    case UIUserInterfaceSizeClassRegular = 2
}


internal class CommonAssetStorage {

    func allAssetKeys() -> [String]? {
        return nil
    }
    
    func allRenditionNames() -> [String]? {
        return nil
    }

    init(path: String) {
        
    }

    func versionString() {
        
    }
    
}

public class CarExport {
    
    internal func idiomSuffixForCoreThemeIdiom(idiom: ThemeIdiom) -> String {
        switch (idiom) {
        case .kCoreThemeIdiomUniversal:
            return ""
        case .kCoreThemeIdiomPhone:
            return "~iphone"
        case .kCoreThemeIdiomPad:
            return "~ipad"
        case .kCoreThemeIdiomTV:
            return "~tv"
        case .kCoreThemeIdiomCar:
            return "~carplay"
        case .kCoreThemeIdiomWatch:
            return "~watch"
        case .kCoreThemeIdiomMarketing:
            return "~marketing"
        }
    }
    
    internal func sizeClassSuffixForSizeClass(sizeClass: UserInterfaceSizeClass) -> String {
        switch (sizeClass) {
        case .UIUserInterfaceSizeClassCompact:
            return "C"
        case .UIUserInterfaceSizeClassRegular:
            return "R"
        default:
            return "A"
        }
    }
    
    internal func getImagesArray(catalog: Catalog, key: String) {
        NSMutableArray *images = [[NSMutableArray alloc] initWithCapacity:5];
        
        for (NSNumber *scaleFactor in @[@1, @2, @3])
        {
            CUINamedImage *image = [catalog imageWithName:key scaleFactor:scaleFactor.doubleValue];
            
            if (image && image.scale == scaleFactor.floatValue) [images addObject:image];
        }
        
        return images;
    }
}
