#!/usr/bin/python

from struct import *
from zlib import *
import stat
import sys
import os

def getNormalizedPNG(filename):
    pngheader = "\x89PNG\r\n\x1a\n"
    
    file = open(filename, "rb")
    oldPNG = file.read()
    file.close()

    if oldPNG[:8] != pngheader:
        return None
    
    newPNG = oldPNG[:8]
    
    chunkPos = len(newPNG)
    
    idatAcc = ""
    breakLoop = False
    
    # For each chunk in the PNG file    
    while chunkPos < len(oldPNG):
        skip = False
        
        # Reading chunk
        chunkLength = oldPNG[chunkPos:chunkPos+4]
        chunkLength = unpack(">L", chunkLength)[0]
        chunkType = oldPNG[chunkPos+4 : chunkPos+8]
        chunkData = oldPNG[chunkPos+8:chunkPos+8+chunkLength]
        chunkCRC = oldPNG[chunkPos+chunkLength+8:chunkPos+chunkLength+12]
        chunkCRC = unpack(">L", chunkCRC)[0]
        chunkPos += chunkLength + 12

        # Parsing the header chunk
        if chunkType == "IHDR":
            width = unpack(">L", chunkData[0:4])[0]
            height = unpack(">L", chunkData[4:8])[0]

        # Parsing the image chunk
        if chunkType == "IDAT":
            # Store the chunk data for later decompression
            idatAcc += chunkData
            skip = True

        # Removing CgBI chunk        
        if chunkType == "CgBI":
            skip = True

        # Add all accumulated IDATA chunks
        if chunkType == "IEND":
            try:
                # Uncompressing the image chunk
                bufSize = width * height * 4 + height
                chunkData = decompress( idatAcc, -15, bufSize)
                
            except Exception, e:
                # The PNG image is normalized
                print e
                return None

            chunkType = "IDAT"

            # Swapping red & blue bytes for each pixel
            newdata = ""
            for y in xrange(height):
                i = len(newdata)
                newdata += chunkData[i]
                for x in xrange(width):
                    i = len(newdata)
                    newdata += chunkData[i+2]
                    newdata += chunkData[i+1]
                    newdata += chunkData[i+0]
                    newdata += chunkData[i+3]

            # Compressing the image chunk
            chunkData = newdata
            chunkData = compress( chunkData )
            chunkLength = len( chunkData )
            chunkCRC = crc32(chunkType)
            chunkCRC = crc32(chunkData, chunkCRC)
            chunkCRC = (chunkCRC + 0x100000000) % 0x100000000
            breakLoop = True

        if not skip:
            newPNG += pack(">L", chunkLength)
            newPNG += chunkType
            if chunkLength > 0:
                newPNG += chunkData
            newPNG += pack(">L", chunkCRC)
        if breakLoop:
            break
        
    return newPNG

def updatePNG(filename):
    data = getNormalizedPNG(filename)
    if data != None:
        file = open(filename, "wb")
        file.write(data)
        file.close()
        return True
    return data

def getFiles(base):
    global _dirs
    global _pngs
    if base == ".":
        _dirs = []
        _pngs = []
        
    if base in _dirs:
        return

    files = os.listdir(base)
    for file in files:
        filepath = os.path.join(base, file)
        try:
            st = os.lstat(filepath)
        except os.error:
            continue
        
        if stat.S_ISDIR(st.st_mode):
            if not filepath in _dirs:
                getFiles(filepath)
                _dirs.append( filepath )
                
        elif file[-4:].lower() == ".png":
            if not filepath in _pngs:
                _pngs.append( filepath )
            
    if base == ".":
        return _dirs, _pngs

dirs, pngs = getFiles(".")

if len(pngs) == 0:
    print "0"
    exit()
    

normalized = 0
for ipng in xrange(len(pngs)):
    perc = (float(ipng) / len(pngs)) * 100.0
    if updatePNG(pngs[ipng]):
        normalized += 1

print "%d" % normalized
exit()
