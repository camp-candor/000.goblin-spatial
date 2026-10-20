import Geojson from './fce/geojson.interface'
import GeojsonBit from './fce/geojson.interface'

export class GeojsonModel implements Geojson {
    //idx:string;
    //geojsonBitList: GeojsonBit[] = [];
    //geojsonBits: any = {};
    geojsonData: any
    geoSrc: string = './data/geojson'
    captureLocationList: any = [
        'https://geoman.io/geojson-editor',
        'https://www.keene.edu/campus/maps/tool/',
    ]
}
