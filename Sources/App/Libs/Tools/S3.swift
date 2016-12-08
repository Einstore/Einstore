//
//  S3.swift
//  Boost
//
//  Created by Ondrej Rafaj on 01/12/2016.
//
//

import Foundation
import Vapor
import S3SignerAWS
import HTTP


public enum S3FilePermissions: String {
    case privateAccess = "private"
    case publicRead = "public-read"
    case publicReadWrite = "public-read-write"
    case awsExecRead = "aws-exec-read"
    case authenticatedRead = "authenticated-read"
    case bucketOwnerRead = "bucket-owner-read"
    case bucketOwnerFullControl = "bucket-owner-full-control"
}

public struct Bucket {
    
}

public struct File {
    
}

public class S3 {
    
    public let bucketName: String?
    
    let signer: S3SignerAWS
    
    
    // MARK: Initialization
    
    public init(accessKey: String, secretKey: String, bucketName: String?, region: Region) {
        self.bucketName = bucketName
        self.signer = S3SignerAWS(accessKey: accessKey, secretKey: secretKey, region: region)
    }
    
    convenience init(accessKey: String, secretKey: String, region: Region = .usEast1_Virginia) {
        self.init(accessKey: accessKey, secretKey: secretKey, bucketName: nil, region: region)
    }
    
    // MARK: Managing objects
    
    public func put(data: Data, filePath: String, bucketName: String, aclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
    public func put(data: Data, filePath: String, aclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
    public func get(infoForFilePath filePath: String, bucketName: String? = nil) throws -> [String: String]? {
        do {
            let fileUrl: URL? = try self.buildUrl(bucketName: bucketName, fileName: filePath)
            guard let url = fileUrl else {
                print("fuck")
                return nil
            }
            let headers = try signer.authHeaderV4(httpMethod: .get, urlString: url.absoluteString, headers: [:], payload: .none)
            var request = URLRequest(url: url)
            request.httpMethod = HTTPMethod.get.rawValue
            for header in headers {
                request.setValue(header.key, forHTTPHeaderField: header.value)
            }
            
            
            var newHeaders: [HeaderKey : String] = [:]
            for header in headers {
                let hk = HeaderKey(header.key)
                newHeaders[hk] = header.value
            }
            let result = try drop.client.get(fileUrl!.absoluteString, headers: newHeaders, query: [:], body: Body.init(""))
            print(result)
            
            var response: URLResponse?
            let data: Data = try NSURLConnection.sendSynchronousRequest(request, returning: &response)
            let responseString = String(data: data, encoding: String.Encoding.utf8)
            print(responseString ?? "no response woe!")
        } catch {
            print(error)
        }
        
        return nil
    }
    
    
    
    public func get(fileAtPath: String, bucketName: String? = nil) throws -> Data? {
        return nil
    }
    
    public func copy(fileAtPath: String, sourceBucketName: String, destinationFilePath: String, targetBucketName: String, targetAclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
    public func copy(fileAtPath: String, sourceBucketName: String, destinationFilePath: String, targetAclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
    public func copy(fileAtPath: String, destinationFilePath: String, targetAclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
    public func delete(fileAtPath: String, bucketName: String? = nil) throws {
        
    }
    
    // MARK: Buckets handling
    
    public func getBuckets(simple: Bool = true) throws -> [Bucket]? {
        return nil
    }
    
    public func createBucket(bucketName: String) throws {
        
    }
    
    public func get(contentOfBucket: String? = nil) throws -> [File]? {
        return nil
    }
    
    public func deleteBucket(bucketName: String? = nil) throws {
        
    }
    
}

extension S3 {
    
    func buildUrl(bucketName: String?, fileName: String) throws -> URL? {
        var bucket: String? = bucketName
        if bucket == nil {
            bucket = self.bucketName
        }
        guard bucket != nil else {
            // TODO: Throw error
            print("fuck")
            return nil
        }
        // TODO: Do URL append path instead!!!
        
        return URL(string: "https://s3.amazonaws.com/" + bucket! + "/" + fileName)
    }
    
}

extension S3 {
    
    public func put(string: String, filePath: String, bucketName: String, contentType: String? = nil, aclPermission: S3FilePermissions = .privateAccess) throws {
        var headers: [String: String] = [String: String]()
        if contentType == nil {
            headers["Content-Type"] = "text/plain"
        }
        else {
            headers["Content-Type"] = contentType
        }
    }
    
    public func put(string: String, filePath: String, bucketName: String, aclPermission: S3FilePermissions) throws {
        
    }
    
    public func put(string: String, filePath: String, aclPermission: S3FilePermissions = .privateAccess) throws {
        try self.put(string: string, filePath: filePath, bucketName: self.bucketName!, contentType: nil, aclPermission: aclPermission)
    }

}

extension S3 {
    
    public func put(bytes: Bytes, filePath: String, bucketName: String, aclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
    public func put(bytes: Bytes, filePath: String, aclPermission: S3FilePermissions = .privateAccess) throws {
        
    }
    
}
