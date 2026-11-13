# Draws the app icons: three cards flying upward on a green-to-blue
# gradient, with fading after-images behind them to show the movement. The cards hold a blue solid circle, a red
# shaded triangle and a green hollow square, which together make a trio.
# All colours come from the app's card palette. Everything is drawn on a
# 512-unit canvas and scaled to each size the app needs.
# Run from anywhere on Windows:  pwsh triplet/tools/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\icons'
function Color($hex, $alpha = 255) { [System.Drawing.Color]::FromArgb($alpha, [System.Drawing.ColorTranslator]::FromHtml($hex)) }

# Background gradient (palette greens into blues) and card symbols (light shades)
$bgStops = @('#2fd29b', '#009e73', '#0072b2', '#0a5a9c')
$shadowHex = '#03203a'
$blue = '#0072b2'; $red = '#d55e00'; $green = '#009e73'
$cardW = 140; $cardH = 204

function RoundRect($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  $p
}

function ShapePath($shape, $size) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $h = $size / 2
  switch ($shape) {
    'circle'   { $p.AddEllipse(-$h, -$h, $size, $size) }
    'triangle' {
      $p.AddPolygon([System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF 0, (-$h * 1.05)),
        (New-Object System.Drawing.PointF ($h * 1.05), ($h * 0.8)),
        (New-Object System.Drawing.PointF (-$h * 1.05), ($h * 0.8))))
    }
    'square'   { $p = RoundRect (-$h * .9) (-$h * .9) ($size * .9) ($size * .9) ($size * .1) }
  }
  $p
}

# A card outline centred at ($cx, $cy), tilted by $angle, filled white at $alpha.
function CardBody($g, $cx, $cy, $angle, $alpha, $shadow) {
  $state = $g.Save()
  $g.TranslateTransform($cx, $cy)
  $g.RotateTransform($angle)
  if ($shadow) {
    $g.FillPath((New-Object System.Drawing.SolidBrush (Color $shadowHex 90)), (RoundRect (-$cardW / 2 + 8) (-$cardH / 2 + 14) $cardW $cardH 24))
  }
  $g.FillPath((New-Object System.Drawing.SolidBrush (Color '#ffffff' $alpha)), (RoundRect (-$cardW / 2) (-$cardH / 2) $cardW $cardH 24))
  $g.Restore($state)
}

function Symbol($g, $shape, $fill, $hex, $cx, $cy, $angle) {
  $state = $g.Save()
  $g.TranslateTransform($cx, $cy)
  $g.RotateTransform($angle)
  $path = ShapePath $shape 76
  $pen = New-Object System.Drawing.Pen (Color $hex), 12
  $pen.LineJoin = 'Round'
  switch ($fill) {
    'solid'  { $g.FillPath((New-Object System.Drawing.SolidBrush (Color $hex)), $path); $g.DrawPath($pen, $path) }
    'shaded' { $g.FillPath((New-Object System.Drawing.SolidBrush (Color $hex 90)), $path); $g.DrawPath($pen, $path) }
    'hollow' { $g.DrawPath($pen, $path) }
  }
  $g.Restore($state)
}

# One moving card: two fading echoes trailing back towards $from, each a
# little less turned, so the card looks like it's spinning as it flies.
function Trail($g, $card, $from) {
  $dx = $card.x - $from.x; $dy = $card.y - $from.y
  foreach ($s in @(@{ t = 0.6; a = 60 }, @{ t = 0.8; a = 120 })) {
    $x = $from.x + $dx * $s.t
    $y = $from.y + $dy * $s.t
    $ang = $from.angle + ($card.angle - $from.angle) * $s.t
    CardBody $g $x $y $ang $s.a $false
  }
}

function Art($g) {
  $left   = @{ x = 120; y = 260; angle = -24 }
  $right  = @{ x = 392; y = 260; angle = 24 }
  $middle = @{ x = 256; y = 216; angle = 0 }

  # Trails, all behind the real cards. Each card flies up from below.
  Trail $g $left   @{ x = 156; y = 424; angle = -4 }
  Trail $g $right  @{ x = 356; y = 424; angle = 4 }
  Trail $g $middle @{ x = 256; y = 394; angle = 0 }

  # The cards: left and right, then the middle one on top
  CardBody $g $left.x $left.y $left.angle 255 $true
  Symbol $g 'circle' 'solid' $blue $left.x $left.y 0
  CardBody $g $right.x $right.y $right.angle 255 $true
  Symbol $g 'square' 'hollow' $green $right.x $right.y ($right.angle - 10)
  CardBody $g $middle.x $middle.y $middle.angle 255 $true
  Symbol $g 'triangle' 'shaded' $red $middle.x ($middle.y + 4) 10
}

function Background($g) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, 512, 512
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (Color $bgStops[0]), (Color $bgStops[-1]), 60
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend
  $blend.Colors = [System.Drawing.Color[]]($bgStops | ForEach-Object { Color $_ })
  $blend.Positions = [single[]]@(0, 0.4, 0.75, 1)
  $brush.InterpolationColors = $blend
  $g.FillRectangle($brush, $rect)
  # A soft glow behind where the cards burst from
  $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glow.AddEllipse(56, 90, 400, 400)
  $pg = New-Object System.Drawing.Drawing2D.PathGradientBrush $glow
  $pg.CenterColor = Color '#ffffff' 90
  $pg.SurroundColors = [System.Drawing.Color[]]@(Color '#ffffff' 0)
  $g.FillPath($pg, $glow)
}

# Draws the art $scale times the icon size, centred on the background.
# Maskable icons get a smaller picture so circle crops keep the cards whole.
function Icon($px, $name, $scale) {
  $bmp = New-Object System.Drawing.Bitmap $px, $px
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.ScaleTransform($px / 512, $px / 512)
  Background $g
  $g.TranslateTransform(256 * (1 - $scale), 256 * (1 - $scale))
  $g.ScaleTransform($scale, $scale)
  Art $g
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Icon 512 'icon-512.png' 1
Icon 192 'icon-192.png' 1
Icon 180 'apple-touch-icon.png' 1
Icon 512 'icon-maskable-512.png' 0.76
