// global variables
var data_fetched = false;
var allGenesCN = false;
var fileData;

//function for clicking event that is used to lauch IGVJS tab and fetch data
var prepDataForSegView = function () {
    var genes = "KRAS,NRAS,BRAF";
    var url = "data/tcga_cna.seg";
    if (!data_fetched) {
        data_fetched = true;   
        fileData= new ReadTextFile(url);
        showAllGenesPanel(genes); 
    } 
}


var showAllGenesPanel = function (genes){
    $("#gene_tab").show();
    var genesArray = genes.split(',');
    console.log(genesArray);
    var inputNumber = genesArray.length; 

console.log(inputNumber);

    if($('input[name="sort"]').length==0){
        $("#sort").append("Sort By:");
        for (i=0; i<inputNumber; i++){
            console.log(genesArray[i]);
            $("#sort").append(
            '<label><input type="radio" name="sort" value="' + genesArray[i]+'"  onclick="checkedSort()"/>'+genesArray[i]+'</label>'); 
        }
    }
   
    if(allGenesCN==false) {
        for (i=0; i<inputNumber; i++){
            console.log(genesArray[i]);
            $("#d3_segment").append(
            '<div class="geneName" style="width:'+99/inputNumber+'%">'+genesArray[i]+'</h1></div>');  
        }
        $("#d3_segment").append('<div class="col-lg-offset-4 col-lg-2" id="segmentCN"><h2>Loading Data...</h2><div>');
        startAllGenes(genesArray);
    }
  
}

var data = {};
var startAllGenes = function(genesArray){
    allGenesCN = true;

    d3.json("data/geneMapping.json", function(geneMapping) {
        console.log(geneMapping);
        fileData.read();        
        var lines=[];
        lines = allText.split('\n');
       /* var samples =[];
        var previousName = "";
        for(var i=1; i<lines.length-1; i++){
            var segments = lines[i].split('\t')[0];  
            if(segment!=previousName) {
                samples.push("segmentName");
            }
            previousName= segmentName;
        }
        console.log(samples);*/
    /*  var geneinfo = new BroadInstituteGeneInfo (genesArray);
        geneinfo.getGeneMapping();
    */  
         
        for(j =0; j<genesArray.length; j++){
            var geneName= genesArray[j];
            var chrSegment=[];  
            data['"'+geneName+'"']=[];
            for(var i=1; i<lines.length-1; i++){
             
                var allSegment = lines[i].split('\t');                 
 
                var geneChr = geneMapping[geneName].chr.toString();

                if (allSegment[1]===geneChr){

                    chrSegment.push(
                       {
                        "sample": allSegment[0],
                        "chr": parseInt(allSegment[1]),
                        "CNStart": parseInt(allSegment[2]),
                        "CNEnd": parseInt(allSegment[3]),
                        "num_probes": parseInt(allSegment[4]),
                        "CNValue": parseFloat(allSegment[5])
                    });
                } 

            }

            for (var i=0; i<chrSegment.length; i++){
                var genebpEnd = geneMapping[geneName].bpEnd;
                var genebpStart = geneMapping[geneName].bpStart; 

                if(chrSegment[i].CNEnd>=genebpStart &&chrSegment[i].CNStart<=genebpEnd){

                    var averageVal = chrSegment[i].CNValue
                    var sampleName = chrSegment[i].sample;          
                   
                    data['"'+geneName+'"'].push(
                       {
                        "sample": chrSegment[i].sample,
                        "chr": chrSegment[i].chr,
                        "start": chrSegment[i].CNStart,
                        "end": chrSegment[i].CNEnd,
                        "num_probs": chrSegment[i].num_probes,
                        "value": averageVal
                       });
                } 
     
                /* var geneSegmentVal = (bpEnd-bpStart)*averageVal; 
                var value =  samples['"'+data['"'+geneName+'"'].sample+'"'] ;
                samples['"'+data['"'+geneName+'"'].sample+'"'] = value -1+ geneSegmentVal;
                console.log("samples");
                console.log(samples);
                */
            }

        }

        var segmenCNViz= new D3SegmentCNViz(data, genesArray, geneMapping); 
         
        //sorting bar chart                
        d3.selectAll('input[name="sort"]').on("click", function(){ 
            sortBars(data);
            //maintain an original aggregated/unaggregated and sorted/unsorted status
            segmenCNViz.update(refined_data,sortChecked);
        }); 

        //function for sorting bars
        var direction="original";
        var sortBars=function(data){  
    
            if(direction === "ascending"){
                refined_data=data['"'+sortChecked+'"'].sort(function(a,b){return d3.descending(a.value, b.value)});
                direction = "descending";
            } else{
                refined_data=data['"'+sortChecked+'"'].sort(function(a,b){return d3.ascending(a.value, b.value)});
                direction = "ascending";
            }
        } 
      
    });
}

//function for checking which sorted radio box is checked
    var sortChecked ="";
    function checkedSort(){
        d3.selectAll('input[name="sort"]').each(function (d) {
            if(d3.select(this).attr("type") == "radio" &&d3.select(this).node().checked) {
                sortChecked =d3.select(this).attr("value");
            }         
        });    
    }      
