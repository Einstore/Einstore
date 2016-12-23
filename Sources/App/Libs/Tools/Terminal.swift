//
//  Terminal.swift
//  Boost
//
//  Created by Ondrej Rafaj on 05/12/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation


#if os(Linux)
    typealias Process = Task
#endif


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
        #if os(Linux)
            while task.running {
                Thread.sleep(forTimeInterval: 0.1)
            }
        #else
            while task.isRunning {
                Thread.sleep(forTimeInterval: 0.1)
            }
        #endif
        
        let result: TerminalResult = TerminalResult(exitCode: task.terminationStatus, output: nil)
        return result
    }
    
}
