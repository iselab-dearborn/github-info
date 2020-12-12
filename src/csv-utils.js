
const ExportToCsv = require('export-to-csv').ExportToCsv;

const options = {
    fieldSeparator: ',',
    quoteStrings: '',
    decimalSeparator: '.',
    showLabels: true,
    showTitle: false,
    useTextFile: false,
    useBom: true,
    useKeysAsHeaders: true,
};

const csvExporter = new ExportToCsv(options);

class CSVUtils {

    static export(data) {
        return csvExporter.generateCsv(data, true);
    }
}

module.exports = CSVUtils;
