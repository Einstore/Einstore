//
//  XML.swift
//  XML
//
//  Created by Craig Grummitt on 24/08/2016.
//  Copyright © 2016 interactivecoconut. All rights reserved.
//

import Foundation


// MARK: - XML

// Use XML class for XML document. Parse using Foundation's XMLParser
class XML: XMLNode {
    
    var parser:XMLParser
    
    // MARK: Initialization
    
    init(data: Data) {
        self.parser = XMLParser(data: data)
        
        super.init()
        
        parser.delegate = self
        let _ = parser.parse()
    }
    
    init?(contentsOf url: URL) {
        guard let parser = XMLParser(contentsOf: url) else { return nil}
        self.parser = parser
        
        super.init()
        
        parser.delegate = self
        let _ = parser.parse()
    }
    
}

// MARK: - Node

// Each element of the XML hierarchy is represented by an XMLNode <name attribute="attribute_data">text<child></child></name>
class XMLNode: NSObject {
    
    var name:String?
    var attributes:[String:String] = [:]
    var text = ""
    var children:[XMLNode] = []
    var parent:XMLNode?
    
    
    // MARK: Initialization
    
    override init() {
        
    }
    
    init(name:String) {
        self.name = name
    }
    
    init(name:String,value:String) {
        self.name = name
        self.text = value
    }
    
    // MARK: Update data
    func indexIsValid(index: Int) -> Bool {
        return (index >= 0 && index <= children.count)
    }
    
    subscript(index: Int) -> XMLNode {
        get {
            assert(indexIsValid(index: index), "Index out of range")
            return children[index]
        }
        set {
            assert(indexIsValid(index: index), "Index out of range")
            children[index] = newValue
            newValue.parent = self
        }
    }
    
    subscript(index: String) -> XMLNode? {
        // If more than one exists, assume the first
        get {
            return children.filter({ $0.name == index }).first
        }
        set {
            guard let newNode = newValue, let filteredChild = children.filter({ $0.name == index }).first else {
                return
            }
            filteredChild.attributes = newNode.attributes
            filteredChild.text = newNode.text
            filteredChild.children = newNode.children
        }
    }
    
    func addChild(_ node:XMLNode) {
        children.append(node)
        node.parent = self
    }
    
    func addChild(name:String,value:String) {
        addChild(XMLNode(name: name, value: value))
    }
    
    func removeChild(at index:Int) {
        children.remove(at: index)
    }
    
    // MARK: Description properties
    
    override var description:String {
        if let name = name {
            return "<\(name)\(attributesDescription)>\(text)\(childrenDescription)</\(name)>"
        }
        else if let first = children.first {
            return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\(first.description)"
        }
        else {
            return ""
        }
    }
    
    var attributesDescription:String {
        return attributes.map({" \($0)=\"\($1)\" "}).joined()
    }
    
    var childrenDescription:String {
        return children.map({ $0.description }).joined()
    }
    
}

// MARK: - Parser delegate methods

extension XMLNode: XMLParserDelegate {
    
    public func parser(_ parser: XMLParser, foundCharacters string: String) {
        text += string.trimmingCharacters(in: NSCharacterSet.whitespacesAndNewlines)
    }
    
    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String : String] = [:]) {
        let childNode = XMLNode()
        childNode.name = elementName
        childNode.parent = self
        childNode.attributes = attributeDict
        parser.delegate = childNode
        
        children.append(childNode)
    }
    
    func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
        if let parent = parent {
            parser.delegate = parent
        }
    }
    
    func parserDidStartDocument(_ parser: XMLParser) {
        
    }
    
    func parserDidEndDocument(_ parser: XMLParser) {
        
    }
    
    func parser(_ parser: XMLParser, foundUnparsedEntityDeclarationWithName name: String, publicID: String?, systemID: String?, notationName: String?) {
        
    }
}
