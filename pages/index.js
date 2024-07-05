import react, { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import styles from './index.module.css'
import { Rect } from 'fabric';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


var pdfjsLib;
export default function Index() {
    const wisdom = ["Cooking.....", "Brewing Cofee...", "Siam Arif Gay", "Auto Chai", "WaItin", "Sure fail", "Get a life, will you?", "BUET er porei KUET", "CSE Amar passion", "KUET iss <3,,, what yikEs"]
    var anno, pdl, pdlh;
    const waitRef = useRef(null)
    const pdfRef = useRef(null)
    const pNR = useRef(null)
    const fuhR = useRef(null)
    const ltR = useRef(null)
    const pdfRefH = useRef(null)
    const annoRef = useRef(null)
    const keyRef = useRef(null)
    const prevRef = useRef(null)
    const currentRef = useRef(null)
    const nextRef = useRef(null)
    const keyRefCurr = useRef(null)
    const statusRef = useRef(null)
    const layerContainer = useRef(null)
    const state = {
        loaded: false,
        currentPage: -1,
        currentChar: 'a',
        pdf: null
    }
    let states = new Map()
    let alphabet = [...Array(26)].map((e, i) => (i + 10).toString(36))
    let alph_count = new Map(alphabet.map(x => [x, 0]))
    let annotations = [null,]
    let finalMap = new Map(alphabet.map(x => [x, []]))



    useEffect(async () => {
        pdfjsLib = await import('pdfjs-dist/webpack');
        document.body.addEventListener("keyup", setChar)
        if (!annoRef) return
        anno = new fabric.Canvas(annoRef.current, { selection: false });
        pdl = pdfRef.current.getContext('2d');
        pdlh = pdfRefH.current.getContext('2d');
        anno.on("mouse:down", (options) => {
            if (options.target === undefined) {
                keyRefCurr.current.innerHTML = '-'
                getMousePos
                const rect = new fabric.Rect({
                    left: options.e.offsetX - 15,
                    top: options.e.offsetY - 15 * 2.5,
                    fill: "#00FF00AA",
                    //stroke: "#000",
                    width: 30,
                    height: 30 * 2.5,
                    lockScalingFlip: true,
                    lockSkewingX: true,
                    lockSkewingY: true
                });
                rect.char = state.currentChar
                rect.on('scaling', function () {
                    let factor = (this.scaleX != 1) ? this.scaleX : this.scaleY;
                    console.log(factor, this.scaleX, this.scaleY, this)
                    this.set({
                        width: this.width * factor,
                        height: this.width * factor * 2.5,
                        scaleX: 1,
                        scaleY: 1
                    })
                })
                anno.add(rect);
                alph_count.set(state.currentChar, alph_count.get(state.currentChar) + 1)
                document.querySelector(`#state_${state.currentChar} > span`).innerHTML = (alph_count.get(state.currentChar));

            } else {
                keyRefCurr.current.innerHTML = options.target.char
            }

        })
        return () => {
            void anno.dispose()
        }
    })



    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }


    async function loadPDF(event) {
        attachWait()
        let file = event.target.files[0];
        let typedarray = new Uint8Array(await file.arrayBuffer())
        await pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            state.pdf = pdf
            pNR.current.innerHTML = pdf.numPages
            console.log(pdf.numPages)
            pdf.getPage(1).then(function (page) {
                state.currentPage = 1;
                currentRef.current.value = 1
                console.log(state)
                var canvas = pdfRef.current
                canvas.width = (window.innerWidth || document.clientWidth || document.body.clientWidth) * 80 / 100;
                var viewport = page.getViewport({ scale: canvas.width / page.getViewport({ scale: 1.0 }).width });
                canvas.height = viewport.height;
                pdfRefH.current.width = pdfRef.current.width
                pdfRefH.current.height = pdfRef.current.height
                anno.setWidth(canvas.width)
                anno.setHeight(canvas.height)
                page.render({ canvasContext: pdl, viewport: viewport }).promise.then(() => {
                    fuhR.current.style.display = 'none'
                    ltR.current.style.display = 'block'
                    detachWait()
                });
            });
        })
    }

    async function Zip() {
        const zip = new JSZip();
        for (const [key, blobs] of finalMap.entries()) {
            const folder = zip.folder(key)
            blobs.forEach((blob, index) => {
                folder.file(`sample${index + 1}.png`, blob, { binary: true })
            })
        }
        return await new Promise(resolve => zip.generateAsync({ type: 'blob' }).then(blob => resolve(blob)))
    }


    async function downloadFile() {
        attachWait()
        for (let i = 1; i <= state.pdf.numPages; i++) {
            await navigation(false, i, true);
            await packFile()
            console.log(i)
        }

        console.log(finalMap)
        saveAs(await Zip(), 'dataset.zip')

        detachWait()
    }

    async function packFile() {
        //console.log(anno.getObjects('rect'))
        for (let a of anno.getObjects('rect')) {
            pdfRefH.current.width = a.width
            pdfRefH.current.height = a.height
            let x = a.aCoords.bl.x + a.aCoords.br.x + a.aCoords.tl.x + a.aCoords.tr.x;
            let y = a.aCoords.bl.y + a.aCoords.br.y + a.aCoords.tl.y + a.aCoords.tr.y;
            x /= 4
            y /= 4
            pdlh.save();
            let rad = -(a.angle) * Math.PI / 180.0;
            pdlh.translate(x, y)
            pdlh.rotate(rad)
            //pdlh.fillRect(-3, -3, 3, 3)
            pdlh.translate(-x, -y)
            pdlh.drawImage(pdfRef.current, 0, 0)
            pdlh.restore();
            pdlh.drawImage(pdfRef.current, x - a.width / 2, y - a.height / 2, a.width, a.height, 0, 0, a.width, a.height)
            await new Promise(resolve => pdfRefH.current.toBlob((blob) => {
                finalMap.get(a.char).push(blob)
                resolve(null)
            }));
        }
    }

    function deleteObject() {
        if (anno.getActiveObject()) {
            let key = anno.getActiveObject().char
            alph_count.set(key, alph_count.get(key) - 1)
            document.querySelector(`#state_${key} > span`).innerHTML = (alph_count.get(key));
            anno.remove(anno.getActiveObject());
        }
        keyRefCurr.current.innerHTML = '-'

    }

    function setChar(event) {

        if (event.keyCode >= 'A'.charCodeAt(0) && event.keyCode <= 'Z'.charCodeAt(0)) {
            let key = String.fromCharCode(event.keyCode)
            state.currentChar = key.toLowerCase()
            console.log(state.currentChar)
            keyRef.current.innerHTML = key.toLowerCase()
            console.log(state)
        }
        else if (event.keyCode == 8 || event.keyCode == 46) {
            if (document.activeElement != currentRef.current) {
                console.log("Delete Selected : DEL/BackSpace pressed");
                deleteObject()
            }
        }
        else { }
    }

    function setCharClick(char) {
        state.currentChar = char
        keyRef.current.innerHTML = char
    }

    function attachWait() {
        waitRef.current.innerHTML = "<span>" + (Math.random() < .9 ? "Waiting" : wisdom[Math.floor(Math.random() * wisdom.length)]) + "</span>"
        waitRef.current.style.display = 'block'
    }

    function detachWait() {
        waitRef.current.style.display = 'none'
    }

    async function navigation(relative, index = 0, daisy = false) {
        if (relative) {
            index = state.currentPage + index
            currentRef.current.value = index
        }
        else {
            if (index == 0) index = currentRef.current.value == "" ? state.currentPage : parseInt(currentRef.current.value)
            else currentRef.current.value = index
        }
        console.log(index)
        if (!daisy) attachWait()
        if (isNaN(index) || index < 1 || index > state.pdf.numPages) return console.log("Outside Bound : ", index, " Total pages : " + state.pdf.numPages)
        let page = await new Promise(resolve => state.pdf.getPage(index).then(function (page) { resolve(page) }));
        states.set(state.currentPage, anno.toObject(['char']))
        anno.clear()

        state.currentPage = index;
        var canvas = pdfRef.current
        canvas.width = (window.innerWidth || document.clientWidth || document.body.clientWidth) * 85 / 100;
        var viewport = page.getViewport({ scale: canvas.width / page.getViewport({ scale: 1.0 }).width });
        pdfRefH.current.height = pdfRef.current.height

        if (states.get(state.currentPage) === undefined) anno.setHeight(canvas.height)
        else await new Promise((resolve) => anno.loadFromJSON(states.get(state.currentPage), () => {
            anno.requestRenderAll()
            resolve()
        }))
        await new Promise((resolve) => page.render({ canvasContext: pdl, viewport: viewport }).promise.then(() => { resolve() }));
        if (!daisy) detachWait()
    }


    return (
        <>
            <div ref={waitRef} style={{ display: 'none' }} className={styles.wait}></div>
            <div ref={layerContainer} className={styles.layerContainer}>
                <canvas ref={pdfRef} className={styles.pdf}></canvas>
                <canvas ref={pdfRefH} className={styles.canvasHidden}></canvas>
                <canvas ref={annoRef} className={styles.anno}></canvas>
            </div>
            <div className={styles.SidePane}>
                <div className={styles.charView}>
                    <div>
                        <span ref={keyRef}>a</span>
                        <p>new</p>
                    </div>
                    <div    >
                        <span ref={keyRefCurr}>-</span>
                        <p>current</p>
                    </div>
                </div>

                <div ref={statusRef} className={styles.StatusBar}>
                    {alphabet.map(char => (
                        <div key={char} id={"state_" + char} onClick={() => setCharClick(char)}>
                            <b>{char}</b> <span> {alph_count.get(char)} </span>
                        </div>
                    ))}
                </div>
                <div ref={fuhR} className={styles.preUP}>
                    <label for="fileU">Select</label>
                    <input type="file" id="fileU" accept="application/pdf" onChange={loadPDF} />
                </div>
                <div ref={ltR} style={{ display: 'none' }}>
                    <div className={styles.navBar} >
                        <input type="button" ref={prevRef} onClick={() => navigation(true, -1)} />
                        <input type="number" ref={currentRef} onBlur={() => navigation(false, 0)} />
                        <span ref={pNR}>&nbsp;</span>
                        <input type="button" ref={nextRef} onClick={() => navigation(true, 1)} />
                    </div>

                    <div className={styles.SideControls}>
                        <input type="submit" value="Download" onClick={downloadFile} />
                    </div>
                </div>
            </div>
        </>
    )
}