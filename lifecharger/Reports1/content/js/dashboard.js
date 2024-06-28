/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 32.5, "KoPercent": 67.5};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.20625, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.35, 500, 1500, "Blog page 28tharik"], "isController": false}, {"data": [0.2, 500, 1500, "About Page 28tharik"], "isController": false}, {"data": [0.0, 500, 1500, "Home Page 28tharik"], "isController": false}, {"data": [0.275, 500, 1500, "Contact Page  28tharik"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 80, 54, 67.5, 2840.4625000000005, 1, 14498, 2111.0, 7233.600000000002, 9137.900000000001, 14498.0, 3.093820094361513, 348.11499795759534, 0.34903668593858767], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Blog page 28tharik", 20, 9, 45.0, 2046.8, 344, 11399, 1050.5, 5459.400000000003, 11109.399999999996, 11399.0, 1.1063170704723972, 78.74287376230778, 0.13180730722425046], "isController": false}, {"data": ["About Page 28tharik", 20, 12, 60.0, 1898.35, 1, 3817, 1733.0, 3710.400000000001, 3814.0, 3817.0, 0.9816432708353784, 127.81484290640032, 0.11201661737999412], "isController": false}, {"data": ["Home Page 28tharik", 20, 20, 100.0, 5813.299999999999, 2385, 14498, 4512.0, 12375.200000000008, 14409.699999999999, 14498.0, 1.1411617026132603, 210.64574596314048, 0.13038663984936666], "isController": false}, {"data": ["Contact Page  28tharik", 20, 13, 65.0, 1603.4, 2, 5278, 1266.0, 4762.400000000004, 5261.5, 5278.0, 1.2594458438287153, 80.74099447024558, 0.13067980557304784], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 3,236 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,123 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 4,948 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 5,612 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,697 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,595 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,720 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 8,378 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,725 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,867 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 6,852 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 4,360 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,291 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,340 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,655 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,510 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: lifecharger.eu:443 failed to respond", 4, 7.407407407407407, 5.0], "isController": false}, {"data": ["The operation lasted too long: It took 1,893 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,548 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,385 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,343 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 7,817 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,638 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 2, 3.7037037037037037, 2.5], "isController": false}, {"data": ["The operation lasted too long: It took 2,497 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 4,131 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 5,607 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,531 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,092 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,639 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,971 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,757 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 7,276 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 9,164 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 14,498 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,817 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 1,676 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 12,732 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,099 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 11,399 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,713 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,680 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 5,278 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 8,642 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,782 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,073 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,682 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 2,702 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,487 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 3,331 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}, {"data": ["The operation lasted too long: It took 4,664 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, 1.8518518518518519, 1.25], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 80, 54, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: lifecharger.eu:443 failed to respond", 4, "The operation lasted too long: It took 2,638 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 2, "The operation lasted too long: It took 3,236 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 2,123 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 4,948 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Blog page 28tharik", 20, 9, "The operation lasted too long: It took 4,131 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 5,607 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 2,099 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 1,893 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 1,725 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1], "isController": false}, {"data": ["About Page 28tharik", 20, 12, "The operation lasted too long: It took 2,638 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 2, "The operation lasted too long: It took 3,236 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 2,123 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: lifecharger.eu:443 failed to respond", 1, "The operation lasted too long: It took 3,757 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1], "isController": false}, {"data": ["Home Page 28tharik", 20, 20, "The operation lasted too long: It took 5,612 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 2,595 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 7,276 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 9,164 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 2,385 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1], "isController": false}, {"data": ["Contact Page  28tharik", 20, 13, "Non HTTP response code: org.apache.http.NoHttpResponseException/Non HTTP response message: lifecharger.eu:443 failed to respond", 3, "The operation lasted too long: It took 1,676 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 1,510 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 4,948 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1, "The operation lasted too long: It took 2,782 milliseconds, but should not have lasted longer than 1,200 milliseconds.", 1], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
