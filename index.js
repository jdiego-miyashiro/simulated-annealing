
const container = $("#isinModelAnimation")[0];
const ctx = container.getContext("2d");
const SpinSizeSlider =  $("#myRange1");
const BetaSlider = $("#myRange2");
const WarmUpRoundSlider = $("#myRange3");
var scale = SpinSizeSlider[0].value;
var cummulativeEnergy;
var cummulativeMagnetization;
var rows=Math.round(container.height/scale); //How many squares of hight 10 can I fit vertically in the height
var cols=Math.round(container.width/scale);   // How many columns of width 10 can I fit horizontally in the width
var SpinGridArray = new Array(rows);
var GridUnitIndex;
var IsinEnergy;
var DivString;


SpinSizeSlider[0].oninput = function(){
  $(".AlphaValue").html(this.value +"%");
  scale=this.value;
  rows=Math.round(container.height/scale); //How many squares of hight 10 can I fit vertically in the height
  cols=Math.round(container.width/scale);   // How many columns of width 10 can I fit horizontally in the width
  SpinGridArray = new Array(rows);
  InitGridArray();
  console.log(rows);
  console.log(cols);
                                                    /*if the change is greater than 0.3 erase the sum of the previous values and start over */
  }

BetaSlider[0].oninput = function(){                                       /*This Slider controls the value of Beta change the value of beta*/
  if ((Math.abs(parseFloat($(".BetaValue").html())-this.value)) > 0.3){       /*if the change is greater than 0.3 erase the sum of the previous values and start over */
    }                                                                         /*And warm up the system by the number of rounds prescribed by the user*/
    EraseObservables();
  for (var i = 0; i <WarmUpRoundSlider.val(); i++) {
    UpdateGridArray(this.value);
  }
  $(".BetaValue").html(this.value);
}
WarmUpRoundSlider[0].oninput = function(){
  $(".ThetaValue").html(this.value);
}

function InitGridArray(){
    for (var i = 0; i < SpinGridArray.length; i++) {
      SpinGridArray[i] = new Array(cols)
      for (var j = 0; j < cols; j++) {
        if (Math.round(Math.random())==1) {
            SpinGridArray[i][j]=1;
        }
        else{
          SpinGridArray[i][j]= -1
        }
      }
    }
}

function UpdateGridArray(beta){
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      GridMCMCStep(i,j,beta);
    }
  }
};


function WarmUpGrid(shots,beta){
  for (var i = 0; i < shots; i++) {
    UpdateGridArray(beta);
  }
}

function GetSpinNearbyEnergy(n,m){
  var EnergyNearby=0;
  for (var i = n-1; i < n+2; i++) {
    for (var j = m-1; j <m+2; j++) {
      if ((i==n && j==m)) {continue;}
      else if (i==-1 || j==-1) {
        shifted_i = i + rows;
        shifted_j = j + cols;
        EnergyNearby = EnergyNearby + SpinGridArray[(shifted_i%rows)][(shifted_j%cols)];
      }
      else {
        EnergyNearby = EnergyNearby + SpinGridArray[(i%rows)][(j%cols)];
      }
    }
  }
  return EnergyNearby;
}

function GridMCMCStep(n,m,beta){
  var EnergyNearby=GetSpinNearbyEnergy(n,m);;
  var EnergyDiff;
  EnergyDiff= 2*SpinGridArray[n][m]*EnergyNearby;
  if (EnergyDiff < 0){
    SpinGridArray[n][m] = -1*SpinGridArray[n][m];
  }
  else if (Math.exp(-1*EnergyDiff*beta) > Math.random()) {
    SpinGridArray[n][m] = -1*SpinGridArray[n][m];
  }
}

function ColorGrid(){
  for (var i = 0; i <cols; i++) {
    for(var j = 0; j <rows; j++){
      var x=i*scale;
      var y=j*scale;
        if ((SpinGridArray[i][j]) == 1){
            ctx.fillStyle="white"
          }
        else{
            ctx.fillStyle="black";
        }
        ctx.fillRect(x,y,scale,scale);
    }
  }
}
function UpdateObservables(beta){
  var Observables = GetEnergyAndMagnet()
  var Energy = Observables[0];
  var EnergySquare=Observables[1]
  var Magnet = Observables[2]
  const BoltzConstant = 1.38064852E-23

  UpdateObservables.iterCount++
  UpdateObservables.CummulativeEnergy=(UpdateObservables.CummulativeEnergy + Energy);
  UpdateObservables.CummulativeEnergySquare=(UpdateObservables.CummulativeEnergySquare + EnergySquare);
  UpdateObservables.CummulativeMagnet=(UpdateObservables.CummulativeMagnet + Magnet);

  var ExpectedEnergyperSpin=(UpdateObservables.CummulativeEnergy/UpdateObservables.iterCount);
  var ExpectedEnergySquareperSpin=(UpdateObservables.CummulativeEnergySquare/UpdateObservables.iterCount);
  var ExpectedMagnetizationperSpin=(UpdateObservables.CummulativeMagnet/UpdateObservables.iterCount);
  var ExpectedHeatCapacityperSpin=(beta*beta*BoltzConstant)*(ExpectedEnergySquareperSpin - Math.pow(ExpectedEnergyperSpin,2))
  $(".Energy").html("Expected Energy per Spin &ltE&gt: " + ExpectedEnergyperSpin.toExponential(3));
  $(".Magnetization").html("Expected Magnetization &ltM&gt: " + ExpectedMagnetizationperSpin.toExponential(3));
  $(".HeatCapacity").html("Heat Capacity per Spin : " + ExpectedHeatCapacityperSpin.toExponential(3))

}

function EraseObservables(){
    UpdateObservables.iterCount = 0;
    UpdateObservables.CummulativeEnergy=0;
    UpdateObservables.CummulativeEnergySquare=0;
    UpdateObservables.CummulativeMagnet=0;
}
function GetEnergyAndMagnet(){
  var Magnetization = 0
  var SystemIterationEnergy=0
  for (var n=0; n< rows; n++){
    for (var m=0; m< cols; m++){
      Magnetization = (Magnetization+SpinGridArray[n][m])
      SystemIterationEnergy=SystemIterationEnergy+GetSpinNearbyEnergy(n,m);
    }
  }
  var SpecificMagnetization=Magnetization/(rows*cols);
  var EnergyperSpin=SystemIterationEnergy/(2*rows*cols);
  var EnergyperSpinSquare=SystemIterationEnergy*SystemIterationEnergy/(2*rows*cols);
  return [EnergyperSpin,EnergyperSpinSquare,SpecificMagnetization]

}
function draw(){
  var beta = BetaSlider.val();
  ColorGrid();
  UpdateGridArray(beta);
  UpdateObservables(beta);
  window.requestAnimationFrame(draw)
  };

InitGridArray();
UpdateObservables.CummulativeEnergy=0;
UpdateObservables.CummulativeEnergySquare=0;
UpdateObservables.CummulativeMagnet=0;
UpdateObservables.iterCount=0;
window.requestAnimationFrame(draw);
