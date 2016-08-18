// global variables
var data_fetched = false;
var allGenesCN = false;
var fileData;
var geneID={};
var geneInfo={};
var geneName=['KRAS','NRAS','BRAF'];
 var geneStartBp;
var geneEndBp;

//function for clicking event that is used to lauch IGVJS tab and fetch data
var prepDataForSegView = function () {
    $.ajax({
        type: "GET",
        crossOrigin: true,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        url:"http://www.genenames.org/cgi-bin/download?col=gd_app_sym&col=gd_pub_eg_id&status_opt=2&chr=1&chr=2&chr=3&chr=4&chr=5&chr=6&chr=7&chr=8&chr=9&chr=10&chr=11&chr=12&chr=13&chr=14&chr=15&chr=16&chr=17&chr=18&chr=19&chr=20&chr=21&chr=22&chr=X&chr=Y&where=&order_by=gd_app_sym_sort&format=text&limit=&hgnc_dbtag=on&submit=submit",  
        success : function (data) {
            lines = data.split('\n');

            for(i=1;i<lines.length; i++){
                units = lines[i].split('\t');
                geneInfo[units[0]]=units[1];                      
            }

            for(var j=0; j<geneName.length;j++){                      
                if(geneInfo[geneName[j]]){
                    geneID[geneName[j]]=geneInfo[geneName[j]]; 
                    getGenePosition(geneID[geneName[j]]);
                    console.log(geneStartBp,geneEndBp);   
                }else{
                    alert("The gene symbol "+geneName+ " is incorrect.");
                }  
            }      

        },
        error : function (data, errorThrown,status) {
                console.log("something wrong when fetch a gene ID.")                                    
            }  
  
   }); 
   

    var genes = "KRAS,NRAS,BRAF";
    var url = "data/tcga_cna.seg";
    if (!data_fetched) {
        data_fetched = true;   
        fileData= new ReadTextFile(url);
        

       
        showAllGenesPanel(genes); 
    } 
}

var getGenePostion= function(geneId){
    var geneLousUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=gene&id="+geneId+"&retmode=json";
    var geneLocusData= new ReadInternetFile(geneLousUrl);
    geneLocusData.read();
    var infoSet=[];  
    var startIndex = lines[6].indexOf("(")+1;
    var midIndex = lines[6].indexOf("..");
    var endIndex = lines[6].indexOf(", ");
    geneStartBp= lines[6].slice(startIndex, midIndex);
    geneEndBp= lines[6].slice(midIndex+2, endIndex);
}

var showAllGenesPanel = function (genes){
    $("#gene_tab").show();
    var genesArray = genes.split(',');
    var inputNumber = genesArray.length; 

    if($('input[name="sort"]').length==0){
        $("#sort").append("Sort By:");
        for (i=0; i<inputNumber; i++){

            $("#sort").append(
            '<label><input type="radio" name="sort" value="' + genesArray[i]+'"  onclick="checkedSort()"/>'+genesArray[i]+'</label>'); 
        }
    }
   
    if(allGenesCN==false) {
        for (i=0; i<inputNumber; i++){

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
