//
//  Terminal.swift
//  Boost
//
//  Created by Ondrej Rafaj on 05/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation


struct TerminalResult {
    let exitCode: Int32
    let output: String?
}


final class Terminal {
    
    
    static func execute(_ args: String...) -> TerminalResult {
        let task = Process()
        task.launchPath = "/usr/bin/env"
        task.arguments = args
        task.launch()
        while task.isRunning {
            Thread.sleep(forTimeInterval: 0.1)
        }
        
        let result: TerminalResult = TerminalResult(exitCode: task.terminationStatus, output: nil)
        return result
    }
    
}
